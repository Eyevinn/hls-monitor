import { HTTPManifestLoader } from "./ManifestLoader";
import { Mutex } from "async-mutex";
const { v4: uuidv4 } = require("uuid");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
export enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

const ERROR_LIMIT = parseInt(process.env.ERROR_LIMIT) || 10;

type SegmentURI = string;

type M3UItem = {
  get: (key: string) => string | any;
  set: (key: string, value: string) => void;
};

type M3U = {
  items: {
    PlaylistItem: M3UItem[];
    StreamItem: M3UItem[];
    IframeStreamItem: M3UItem[];
    MediaItem: M3UItem[];
  };
  properties: {};
  toString(): string;
  get(key: any): any;
  set(key: any, value: any): void;
  serialize(): any;
  unserialize(): any;
};

type VariantData = {
  mediaType?: string;
  mediaSequence?: number;
  newMediaSequence?: number;
  fileSequences?: SegmentURI[];
  newFileSequences?: SegmentURI[];
  discontinuitySequence?: number;
  newDiscontinuitySequence?: number;
  nextIsDiscontinuity?: boolean;
  prevM3U?: M3U;
  duration?: number;
  cueOut?: number;
  cueIn?: number;
};

export enum ErrorType {
  MANIFEST_RETRIEVAL = "Manifest Retrieval",
  MEDIA_SEQUENCE = "Media Sequence",
  PLAYLIST_SIZE = "Playlist Size",
  PLAYLIST_CONTENT = "Playlist Content",
  SEGMENT_CONTINUITY = "Segment Continuity",
  DISCONTINUITY_SEQUENCE = "Discontinuity Sequence",
  STALE_MANIFEST = "Stale Manifest"
}

type MonitorError = {
  eid: string;
  date: string;
  errorType: ErrorType;
  mediaType: string;
  variant: string | number;
  details: string;
  streamUrl: string;
  streamId: string;
  code?: number;
}

type StreamData = {
  variants?: { [bandwidth: number]: VariantData };
  lastFetch?: number;
  newTime?: number;
  errors: ErrorsList;
};

type MonitorOptions = {
  staleLimit?: number;
  monitorInterval?: number;
  logConsole?: boolean;
}

type StreamInput = {
  id?: string;
  url: string;
}

type StreamItem = {
  id: string;
  url: string;
}

export class ErrorsList {
  private errors: MonitorError[] = [];
  private LIST_LIMIT: number = parseInt(process.env.ERROR_LIMIT) || 10;

  constructor() {}

  add(error: MonitorError): void {
    if (!error.eid) {
      error.eid = `eid-${Date.now()}`;
    }
    
    if (this.errors.length >= this.LIST_LIMIT) {
      this.remove();
    }
    this.errors.push(error);
  }

  remove(): void {
    this.errors.shift();
  }

  clear(): void {
    this.errors = [];
  }

  size(): number {
    return this.errors.length;
  }

  listErrors(): MonitorError[] {
    return this.errors;
  }
} 

export class HLSMonitor {
  private streams: StreamItem[] = [];
  private nextStreamId: number = 1;
  private state: State;
  private streamData = new Map<string, StreamData>();
  private staleLimit: number;
  private logConsole: boolean;
  private updateInterval: number;
  private lock = new Mutex();
  private id: string;
  private lastChecked: number;
  private createdAt: string;
  private manifestFetchErrors: Map<string, {code: number, time: number}> = new Map();
  private manifestErrorCount: number = 0;  // Track total manifest errors
  private totalErrorsPerStream: Map<string, number> = new Map();  // Track total errors per stream
  private lastErrorTimePerStream: Map<string, number> = new Map();  // Track last error time per stream
  private usedStreamIds: Set<string> = new Set(); // Track used IDs

  private normalizeStreamId(customId: string): string {
    // Convert to lowercase and replace whitespace with underscore
    let normalizedId = customId.toLowerCase().replace(/\s+/g, '_');
    // Cap at 50 characters
    normalizedId = normalizedId.slice(0, 50);
    
    // If ID already exists, add numeric suffix
    let finalId = normalizedId;
    let counter = 1;
    while (this.usedStreamIds.has(finalId)) {
      finalId = `${normalizedId}_${counter}`;
      counter++;
    }
    
    return finalId;
  }

  private generateStreamId(input: string | StreamInput): string {
    if (typeof input === 'string') {
      const autoId = `stream_${this.nextStreamId++}`;
      this.usedStreamIds.add(autoId);
      return autoId;
    }
    
    if (input.id) {
      const normalizedId = this.normalizeStreamId(input.id);
      this.usedStreamIds.add(normalizedId);
      return normalizedId;
    }
    
    const autoId = `stream_${this.nextStreamId++}`;
    this.usedStreamIds.add(autoId);
    return autoId;
  }

  /**
   * @param hlsStreams The streams to monitor.
   * @param [staleLimit] The monitor interval for streams overrides the default (6000ms) monitor interval and the HLS_MONITOR_INTERVAL environment variable.
   */
  constructor(streamInputs: (string | StreamInput)[], options: MonitorOptions = { staleLimit: 6000, monitorInterval: 3000, logConsole: true }) {
    this.id = uuidv4();
    this.streams = streamInputs.map(input => {
      const url = typeof input === 'string' ? input : input.url;
      return {
        id: this.generateStreamId(input),
        url
      };
    });
    this.state = State.IDLE;
    this.staleLimit = parseInt(process.env.HLS_MONITOR_INTERVAL) || options.staleLimit;
    this.updateInterval = options.monitorInterval || this.staleLimit / 2;
    this.logConsole = options.logConsole;
    this.createdAt = new Date().toISOString();
  }

  /**
   * Function used for unit testing purposes
   */
  async incrementMonitor(streams?: string[]) {
    if (streams) {
      await this.update(streams);
    }
    this.state = State.ACTIVE;
    if (this.state === State.ACTIVE) {
      try {
        await this.parseManifests(this.streams);
      } catch (error) {
        console.error(error);
        this.state = State.INACTIVE;
      }
    }
  }

  async create(streams?: string[]): Promise<void> {
    if (streams) {
      await this.update(streams);
    }
    this.state = State.ACTIVE;
    while (this.state === State.ACTIVE) {
      try {
        this.lastChecked = Date.now();
        await this.parseManifests(this.streams);
        await timer(this.updateInterval);
      } catch (error) {
        console.error(error);
        this.state = State.INACTIVE;
      }
    }
  }

  get monitorId(): string {
    return this.id;
  }

  getUpdateInterval(): number {
    return this.updateInterval;
  }

  getLastChecked(): number {
    return this.lastChecked;
  }

  getState(): State {
    return this.state;
  } 

  setState(state: String): void {
    this.state = state as State;
  } 

  async getErrors(): Promise<MonitorError[]> {
    let errors: MonitorError[] = [];
    let release = await this.lock.acquire();
    for (const [_, data] of this.streamData.entries()) {
      if (data.errors.size() > 0) {
        errors = errors.concat(data.errors.listErrors());
      }
    }
    release();
    return errors.reverse();
  }

  async clearErrors() {
    let release = await this.lock.acquire();
    for (const [key, data] of this.streamData.entries()) {
      if (data.errors.size() > 0) {
        data.errors.clear();
        this.streamData.set(key, data);
      }
    }
    release();
  }

  private async reset() {
    let release = await this.lock.acquire();
    this.state = State.IDLE;
    this.streamData = new Map<string, any>();
    release();
  }

  async start() {
    if (this.state === State.ACTIVE) return;
    
    // Only reset if we don't have any existing streamData
    if (this.streamData.size === 0) {
      await this.reset();
    }
    
    console.log(`Starting HLSMonitor: ${this.id}`);
    this.create();
  }

  async stop() {
    if (this.state === State.INACTIVE) return;
    this.state = State.INACTIVE;
    console.log(`HLSMonitor stopped: ${this.id}`);
  }

  private log(str: string) {
    if (this.logConsole) {
      console.log(str);
    }
  }
  
  private printSummary(data) {
    if (this.logConsole) {
      //console.log(data);
      const d = new Date(data.lastFetch);
      const timeUpdate = d.toLocaleTimeString();
      const variantList = Object.keys(data.variants);
      console.log(`${timeUpdate}\t` + variantList.join('\t'));
      console.log('--------------------------------------------------------------------------');
      const duration = 'DUR(s):\t\t' + variantList.map((v) => data.variants[v].duration.toFixed(2)).join('\t');
      console.log(duration);
      const mediaSeq = 'MSEQ:\t\t' + variantList.map((v) => data.variants[v].mediaSequence).join('\t');
      console.log(mediaSeq);
      const discSeq = 'DSEQ:\t\t' + variantList.map((v) => data.variants[v].discontinuitySequence).join('\t');
      console.log(discSeq);
      const cueOut = 'CUEOUT:\t\t' + variantList.map((v) => data.variants[v].cueOut).join('\t');
      console.log(cueOut);


      console.log('==========================================================================');
    }
  }

  /**
   * Update the list of streams to monitor
   * @param streams The list of streams that should be added
   * to the list of streams to monitor
   * @returns The current list of streams to monitor
   */
  async update(newStreamInputs: (string | StreamInput)[]): Promise<StreamItem[]> {
    let release = await this.lock.acquire();
    try {
      const newStreams = newStreamInputs.map(input => {
        const url = typeof input === 'string' ? input : input.url;
        return {
          id: this.generateStreamId(input),
          url
        };
      });
      this.streams = [...this.streams, ...newStreams];
      return this.streams;
    } finally {
      release();
    }
  }

  /**
   * Removes a stream from the list of streams to monitor
   * @param streams The streams to remove
   * @returns The current list of streams to monitor
   */
  async removeStream(streamId: string): Promise<StreamItem[]> {
    let release = await this.lock.acquire();
    try {
      const streamToRemove = this.streams.find(s => s.id === streamId);
      if (!streamToRemove) {
        throw new Error(`Stream with ID ${streamId} not found`);
      }
      
      // Remove from streams array
      this.streams = this.streams.filter(s => s.id !== streamId);
      
      // Clean up associated data
      const baseUrl = this.getBaseUrl(streamToRemove.url);
      this.streamData.delete(baseUrl);
      this.totalErrorsPerStream.delete(streamId);
      this.lastErrorTimePerStream.delete(streamId);
      this.manifestFetchErrors.delete(streamToRemove.url);
      
      this.usedStreamIds.delete(streamId);
      
      return this.streams;
    } finally {
      release();
    }
  }

  getStreams(): StreamItem[] {
    return this.streams;
  }

  private getBaseUrl(url: string): string {
    let baseUrl: string;
    const m = url.match(/^(.*)\/.*?$/);
    if (m) {
      baseUrl = m[1] + "/";
    }
    return baseUrl;
  }

  // Helper function to determine variant identifier
  private getVariantIdentifier(mediaM3U8: M3UItem, mediaType: string): string {
    if (mediaType === 'VIDEO') {
      return mediaM3U8.get("bandwidth") || "unknown";
    }
    
    // For AUDIO and SUBTITLE, combine groupId with language or name
    const groupId = mediaM3U8.get("groupId");
    if (!groupId) return "unknown";

    const language = mediaM3U8.get("language");
    const name = mediaM3U8.get("name");
    const identifier = language || name;

    return identifier ? `${groupId}__${identifier}` : groupId;
  }

  private async parseManifests(streamUrls: StreamItem[]): Promise<void> {
    const manifestLoader = new HTTPManifestLoader();
    for (const stream of streamUrls) {
      let masterM3U8: M3U;
      let baseUrl = this.getBaseUrl(stream.url);
      let release = await this.lock.acquire();
      let data: StreamData = this.streamData.get(baseUrl) || {
        variants: {},
        errors: new ErrorsList()
      };

      try {
        masterM3U8 = await manifestLoader.load(stream.url);
        this.manifestFetchErrors.delete(stream.url);
      } catch (error) {
        console.error(error);
        console.log("Failed to fetch master manifest:", stream.url);
        
        if (error.isLastRetry) {
          this.manifestFetchErrors.set(stream.url, {
            code: error.statusCode || 0,
            time: Date.now()
          });
          
          const manifestError: MonitorError = {
            eid: `eid-${Date.now()}`,
            date: new Date().toISOString(),
            errorType: ErrorType.MANIFEST_RETRIEVAL,
            mediaType: "MASTER",
            variant: "master",
            details: `Failed to fetch master manifest (${error.statusCode}): ${stream.url}`,
            streamUrl: stream.url,
            streamId: stream.id,
            code: error.statusCode || 0
          };

          data.errors.add(manifestError);
          this.manifestErrorCount++;
          this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
          this.lastErrorTimePerStream.set(stream.id, Date.now());
          release();
          continue;
        }
        release();
        continue;
      }

      // Process variants
      for (const mediaM3U8 of masterM3U8.items.StreamItem.concat(masterM3U8.items.MediaItem)) {
        const variantUrl = `${baseUrl}${mediaM3U8.get("uri")}`;
        let variant: M3U;
        try {
          variant = await manifestLoader.load(variantUrl);
          this.manifestFetchErrors.delete(variantUrl);
        } catch (error) {
          console.log("Failed to fetch variant manifest:", variantUrl);
          
            this.manifestFetchErrors.set(variantUrl, {
              code: error.statusCode || 0,
              time: Date.now()
            });
            
            const manifestError: MonitorError = {
              eid: `eid-${Date.now()}`,
              date: new Date().toISOString(),
              errorType: ErrorType.MANIFEST_RETRIEVAL,
              mediaType: mediaM3U8.get("type") || "VIDEO",
              variant: this.getVariantIdentifier(mediaM3U8, mediaM3U8.get("type") || "VIDEO"),
              details: `Failed to fetch variant manifest (${error.statusCode}): ${variantUrl}`,
              streamUrl: baseUrl,
              streamId: stream.id,
              code: error.statusCode || 0
            };
            data.errors.add(manifestError);
            this.manifestErrorCount++;
            this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
            this.lastErrorTimePerStream.set(stream.id, Date.now());
            continue;
        }
        
        let equalMseq = false;
        let bw = mediaM3U8.get("bandwidth");
        if (["AUDIO", "SUBTITLES"].includes(mediaM3U8.get("type"))) {
          bw = `${mediaM3U8.get("group-id")};${mediaM3U8.get("language") || mediaM3U8.get("name") || ""}`;
        }

        const currTime = new Date().toISOString();
        if (!data.variants[bw]) {
          data.variants[bw] = {
            mediaType: mediaM3U8.get("type") || "VIDEO",
            mediaSequence: null,
            newMediaSequence: null,
            fileSequences: null,
            newFileSequences: null,
            discontinuitySequence: null,
            newDiscontinuitySequence: null,
            nextIsDiscontinuity: null,
            prevM3U: null,
            duration: null,
            cueOut: null,
            cueIn: null
          };
          //console.log(variant.items.PlaylistItem);
          data.variants[bw].mediaSequence = variant.get("mediaSequence");
          data.variants[bw].newMediaSequence = 0;
          data.variants[bw].fileSequences = variant.items.PlaylistItem.map((segItem) => segItem.get("uri"));
          data.variants[bw].newFileSequences = variant.items.PlaylistItem.map((segItem) => segItem.get("uri"));
          data.variants[bw].discontinuitySequence = variant.get("discontinuitySequence");
          data.variants[bw].newDiscontinuitySequence = variant.get("discontinuitySequence");
          data.variants[bw].nextIsDiscontinuity = false;
          data.variants[bw].prevM3U = variant;
          data.variants[bw].duration = 
            variant.items.PlaylistItem
              .map((segItem) => segItem.get("duration")).reduce((acc, cur) => acc + cur);
          data.variants[bw].cueOut =
            variant.items.PlaylistItem
              .map((segItem) => segItem.get("cueout") !== undefined)
              .filter(Boolean).length;
          data.variants[bw].cueIn =
            variant.items.PlaylistItem
              .map((segItem) => segItem.get("cuein") !== undefined)
              .filter(Boolean).length;
  
          data.lastFetch = Date.now();
          data.newTime = Date.now();
          data.errors.clear();

          this.streamData.set(baseUrl, data);
          continue;
        }
        // Update sequence duration
        data.variants[bw].duration = 
          variant.items.PlaylistItem
            .map((segItem) => segItem.get("duration")).reduce((acc, cur) => acc + cur);

        // Update cueout count   
        data.variants[bw].cueOut =
          variant.items.PlaylistItem
            .map((segItem) => segItem.get("cueout") !== undefined)
            .filter(Boolean).length;

        // Update cuein count
        data.variants[bw].cueIn =
          variant.items.PlaylistItem
            .map((segItem) => segItem.get("cuein") !== undefined)
            .filter(Boolean).length;

        // Validate mediaSequence
        if (data.variants[bw].mediaSequence > variant.get("mediaSequence")) {
          const mediaType = data.variants[bw].mediaType;
          const mediaSequence = data.variants[bw].mediaSequence;
          const latestMediaSequence = variant.get("mediaSequence");
          const error: MonitorError = {
            eid: `eid-${Date.now()}`,
            date: currTime,
            errorType: ErrorType.MEDIA_SEQUENCE,
            mediaType: mediaType,
            variant: bw,
            details: `Expected mediaSequence >= ${mediaSequence}. Got: ${latestMediaSequence}`,
            streamUrl: baseUrl,
            streamId: stream.id
          };
          console.error(`[${baseUrl}]`, error);
          data.errors.add(error);
          this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
          this.lastErrorTimePerStream.set(stream.id, Date.now());
          continue;
        } else if (data.variants[bw].mediaSequence === variant.get("mediaSequence")) {
          data.variants[bw].newMediaSequence = data.variants[bw].mediaSequence;
          equalMseq = true;
        } else {
          data.variants[bw].newMediaSequence = variant.get("mediaSequence");
          data.newTime = Date.now();
        }
        // Validate playlist
        const currentSegUriList: SegmentURI[] = variant.items.PlaylistItem.map((segItem) => segItem.get("uri"));
        if (equalMseq && data.variants[bw].fileSequences.length > 0) {
          // Validate playlist Size
          if (data.variants[bw].fileSequences.length > currentSegUriList.length) {
            const error: MonitorError = {
              eid: `eid-${Date.now()}`,
              date: currTime,
              errorType: ErrorType.PLAYLIST_SIZE,
              mediaType: data.variants[bw].mediaType,
              variant: bw,
              details: `Expected playlist size in mseq(${variant.get("mediaSequence")}) to be: ${
                data.variants[bw].fileSequences.length
              }. Got: ${currentSegUriList.length}`,
              streamUrl: baseUrl,
              streamId: stream.id
            };
            console.error(`[${baseUrl}]`, error);
            data.errors.add(error);
            this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
            this.lastErrorTimePerStream.set(stream.id, Date.now());
          } else if (data.variants[bw].fileSequences.length === currentSegUriList.length) {
            // Validate playlist contents
            for (let i = 0; i < currentSegUriList.length; i++) {
              if (data.variants[bw].fileSequences[i] !== currentSegUriList[i]) {
                // [!] Compare the end of filename instead...
                let shouldBeSegURI = new URL("http://.mock.com/" + data.variants[bw].fileSequences[i]).pathname.slice(-5);
                let newSegURI = new URL("http://.mock.com/" + currentSegUriList[i]).pathname.slice(-5);
                if (newSegURI !== shouldBeSegURI) {
                  const error: MonitorError = {
                    eid: `eid-${Date.now()}`,
                    date: currTime,
                    errorType: ErrorType.PLAYLIST_CONTENT,
                    mediaType: data.variants[bw].mediaType,
                    variant: bw,
                    details: `Expected playlist item-uri in mseq(${variant.get("mediaSequence")}) at index(${i}) to be: '${
                      data.variants[bw].fileSequences[i]
                    }'. Got: '${currentSegUriList[i]}'`,
                    streamUrl: baseUrl,
                    streamId: stream.id
                  };
                  console.error(`[${baseUrl}]`, error);
                  data.errors.add(error);
                  this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
                  this.lastErrorTimePerStream.set(stream.id, Date.now());
                }
                break;
              }
            }
          }
        } else {
          // Validate media sequence and file sequence
          const mseqDiff = variant.get("mediaSequence") - data.variants[bw].mediaSequence;
          if (mseqDiff < data.variants[bw].fileSequences.length) {
            const expectedfileSequence = data.variants[bw].fileSequences[mseqDiff];

            // [!] Compare the end of filename instead...
            let shouldBeSegURI = new URL("http://.mock.com/" + expectedfileSequence).pathname.slice(-5);
            let newSegURI = new URL("http://.mock.com/" + currentSegUriList[0]).pathname.slice(-5);
            if (newSegURI !== shouldBeSegURI) {
              const error: MonitorError = {
                eid: `eid-${Date.now()}`,
                date: currTime,
                errorType: ErrorType.SEGMENT_CONTINUITY,
                mediaType: data.variants[bw].mediaType,
                variant: bw,
                details: `Faulty Segment Continuity! Expected first item-uri in mseq(${variant.get(
                  "mediaSequence"
                )}) to be: '${expectedfileSequence}'. Got: '${currentSegUriList[0]}'`,
                streamUrl: baseUrl,
                streamId: stream.id
              };
              console.error(`[${baseUrl}]`, error);
              data.errors.add(error);
              this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
              this.lastErrorTimePerStream.set(stream.id, Date.now());
            }
          }
        }

        // Update newFileSequence...
        data.variants[bw].newFileSequences = currentSegUriList;

        // Validate discontinuitySequence
        const discontinuityOnTopItem = variant.items.PlaylistItem[0].get("discontinuity");
        const mseqDiff = variant.get("mediaSequence") - data.variants[bw].mediaSequence;

        if (!discontinuityOnTopItem && data.variants[bw].nextIsDiscontinuity) {
          // Tag could have been removed, see if count is correct...
          const expectedDseq = data.variants[bw].discontinuitySequence + 1;
          // Warn: Assuming that only ONE disc-tag has been removed between media-sequences
          if (mseqDiff === 1 && expectedDseq !== variant.get("discontinuitySequence")) {
            const error: MonitorError = {
              eid: `eid-${Date.now()}`,
              date: currTime,
              errorType: ErrorType.DISCONTINUITY_SEQUENCE,
              mediaType: data.variants[bw].mediaType,
              variant: bw,
              details: `Wrong count increment in mseq(${variant.get(
                "mediaSequence"
              )}) - Expected: ${expectedDseq}. Got: ${variant.get("discontinuitySequence")}`,
              streamUrl: baseUrl,
              streamId: stream.id
            };
            console.error(`[${baseUrl}]`, error);
            data.errors.add(error);
            this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
            this.lastErrorTimePerStream.set(stream.id, Date.now());
          }
        } else {
          // Case where mseq stepped larger than 1. Check if dseq incremented properly
          if (data.variants[bw].discontinuitySequence !== variant.get("discontinuitySequence")) {
            const dseqDiff = variant.get("discontinuitySequence") - data.variants[bw].discontinuitySequence;
            let foundDiscCount: number = discontinuityOnTopItem ? -1 : 0;
            // dseq step should match amount of disc-tags found in prev mseq playlist
            const playlistSize = data.variants[bw].prevM3U.items.PlaylistItem.length;
            // Ignore dseq count diff when mseq diff is too large to be able to verify
            if (mseqDiff < playlistSize) {
              const end = mseqDiff + 1 <= playlistSize ? mseqDiff + 1 : playlistSize;
              for (let i = 0; i < end; i++) {
                let segHasDisc = data.variants[bw].prevM3U.items.PlaylistItem[i].get("discontinuity");
                if (segHasDisc) {
                  foundDiscCount++;
                }
              }
              if (dseqDiff !== foundDiscCount) {
                const error: MonitorError = {
                  eid: `eid-${Date.now()}`,
                  date: currTime,
                  errorType: ErrorType.DISCONTINUITY_SEQUENCE,
                  mediaType: data.variants[bw].mediaType,
                  variant: bw,
                  details: `Early count increment in mseq(${variant.get("mediaSequence")}) - Expected: ${
                    data.variants[bw].discontinuitySequence
                  }. Got: ${variant.get("discontinuitySequence")}`,
                  streamUrl: baseUrl,
                  streamId: stream.id
                };
                console.error(`[${baseUrl}]`, error);
                data.errors.add(error);
                this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
                this.lastErrorTimePerStream.set(stream.id, Date.now());
              }
            }
          }
        }
        // Determine if discontinuity tag could be removed next increment.
        data.variants[bw].newDiscontinuitySequence = variant.get("discontinuitySequence");
        if (variant.items.PlaylistItem[0].get("discontinuity")) {
          data.variants[bw].nextIsDiscontinuity = true;
        } else {
          if (variant.items.PlaylistItem[1].get("discontinuity")) {
            data.variants[bw].nextIsDiscontinuity = true;
          }
          data.variants[bw].nextIsDiscontinuity = false;
        }
        // Update Sequence counts...
        data.variants[bw].mediaSequence = data.variants[bw].newMediaSequence;
        data.variants[bw].fileSequences = data.variants[bw].newFileSequences;
        data.variants[bw].nextIsDiscontinuity = data.variants[bw].nextIsDiscontinuity ? data.variants[bw].nextIsDiscontinuity : false;
        data.variants[bw].discontinuitySequence = data.variants[bw].newDiscontinuitySequence;
        data.variants[bw].prevM3U = variant;
      }
      // validate update interval (Stale manifest)
      const lastFetch = data.newTime ? data.newTime : data.lastFetch;
      const interval = Date.now() - lastFetch;
      if (interval > this.staleLimit) {
        const error: MonitorError = {
          eid: `eid-${Date.now()}`,
          date: new Date().toISOString(),
          errorType: ErrorType.STALE_MANIFEST,
          mediaType: "ALL",
          variant: "ALL",
          details: `Expected: ${this.staleLimit}ms. Got: ${interval}ms`,
          streamUrl: baseUrl,
          streamId: stream.id
        };
        console.error(`[${baseUrl}]`, error);
        data.errors.add(error);
        this.totalErrorsPerStream.set(stream.id, (this.totalErrorsPerStream.get(stream.id) || 0) + 1);
        this.lastErrorTimePerStream.set(stream.id, Date.now());
      }

      this.streamData.set(baseUrl, {
        variants: data.variants,
        lastFetch: data.newTime ? data.newTime : data.lastFetch,
        errors: data.errors,
      });

      this.printSummary(data);

      if (data.errors.size() > 0) {
        console.log(`[${new Date().toISOString()}] Master manifest loaded with error: ${this.getBaseUrl(stream.url)}`);
      }
      release();
    }
  }

  getManifestFetchErrors(): Map<string, {code: number, time: number}> {
    return this.manifestFetchErrors;
  }

  getCreatedAt(): string {
    return this.createdAt;
  }

  getTotalErrorsPerStream(): Map<string, number> {
    return this.totalErrorsPerStream;
  }

  getLastErrorTimePerStream(): Map<string, number> {
    return this.lastErrorTimePerStream;
  }

  getManifestErrorCount(): number {
    return this.manifestErrorCount;
  }
}
