import { HTTPManifestLoader } from "./ManifestLoader";
import { Mutex } from "async-mutex";
const { v4: uuidv4 } = require("uuid");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
export enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

type TStreamData = {
  mediaSequence?: number;
  newMediaSequence?: number;
  fileSequences?: string[];
  newfileSequences?: string[];
  discontinuitySequence?: number;
  newDiscontinuitySequence?: number;
  nextIsDiscontinuity?: boolean;
  lastFetch?: number;
  newTime?: number;
  errors?: string[];
};

export class HLSMonitor {
  private streams: string[] = [];
  private state: State;
  private streamData = new Map<string, TStreamData>();
  private staleLimit: number;
  private updateInterval: number;
  private lock = new Mutex();
  private id: string;

  /**
   * @param hlsStreams The streams to monitor.
   * @param [staleLimit] The monitor interval for streams overrides the default (6000ms) monitor interval and the HLS_MONITOR_INTERVAL environment variable.
   */
  constructor(hlsStreams: string[], staleLimit?: number) {
    this.id = uuidv4();
    this.streams = hlsStreams;
    this.state = State.IDLE;
    if (staleLimit) {
      this.staleLimit = staleLimit;
    } else {
      this.staleLimit = parseInt(process.env.HLS_MONITOR_INTERVAL || "6000");
    }
    console.log(`Stale-limit: ${this.staleLimit}`);
    this.updateInterval = staleLimit / 2;
  }

  attachMonitorId(id: string) {
    this.id = id;
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
        await this.parseManifests(this.streams);
        await timer(this.updateInterval);
      } catch (error) {
        console.error(error);
        this.state = State.INACTIVE;
      }
    }
  }

  getId(): string {
    return this.id;
  }

  async getErrors(): Promise<Object[]> {
    let errors: Object[] = [];
    let release = await this.lock.acquire();
    for (const [key, data] of this.streamData.entries()) {
      if (data.errors.length > 0) {
        errors.push({
          url: key,
          errors: data.errors,
        });
      }
    }
    release();
    return errors;
  }

  async clearErrors() {
    let release = await this.lock.acquire();
    for (const [key, data] of this.streamData.entries()) {
      if (data.errors.length > 0) {
        data.errors = [];
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
    await this.reset();
    console.log(`Starting HLSMonitor: ${this.id}`);
    this.create();
  }

  async stop() {
    if (this.state === State.INACTIVE) return;
    this.state = State.INACTIVE;
    console.log(`HLSMonitor stopped: ${this.id}`);
  }

  /**
   * Update the list of streams to monitor
   * @param streams The list of streams that should be added
   * to the list of streams to monitor
   * @returns The current list of streams to monitor
   */
  async update(streams: string[]): Promise<string[]> {
    let release = await this.lock.acquire();
    for (const stream of streams) {
      if (!this.streams.includes(stream)) {
        this.streams.push(stream);
      }
    }
    release();
    console.log(`List of streams updated for ${this.id}. Current streams ${this.streams}`);
    return this.streams;
  }

  /**
   * Removes a stream from the list of streams to monitor
   * @param streams The streams to remove
   * @returns The current list of streams to monitor
   */
  async remove(streams: any): Promise<string[]> {
    let release = await this.lock.acquire();
    for (const stream of streams) {
      if (this.streams.includes(stream)) {
        this.streams.splice(this.streams.indexOf(stream), 1);
        const baseUrl = this.getBaseUrl(stream);
        this.streamData.delete(baseUrl);
        console.log(`Removed stream: ${baseUrl} from monitor: ${this.id}`);
      }
    }
    release();
    return this.streams;
  }

  getStreamUrls(): string[] {
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

  private async parseManifests(streamUrls: any[]): Promise<void> {
    if (streamUrls.length === 0) {
      console.error("No stream urls to parse");
      return;
    }
    const manifestLoader = new HTTPManifestLoader();
    for (const streamUrl of streamUrls) {
      const masterM3U8 = await manifestLoader.load(streamUrl);
      let baseUrl = this.getBaseUrl(streamUrl);
      let release = await this.lock.acquire();
      let data = this.streamData.get(baseUrl);
      let error: string;
      for (const mediaM3U8 of masterM3U8.items.StreamItem) {
        let variant;
        try {
          variant = await manifestLoader.load(`${baseUrl}${mediaM3U8.get("uri")}`);
        } catch (error) {
          release();
          return error;
        }
        let equalMseq = false;
        const bw = mediaM3U8.get("bandwidth");
        const currTime = new Date().toISOString();
        if (!data) {
          this.streamData.set(baseUrl, {
            mediaSequence: variant.get("mediaSequence"),
            newMediaSequence: 0,
            fileSequences: [],
            newfileSequences: [],
            discontinuitySequence: 0,
            newDiscontinuitySequence: variant.get("discontinuitySequence"),
            nextIsDiscontinuity: false,
            lastFetch: Date.now(),
            newTime: Date.now(),
            errors: [],
          });
          data = this.streamData.get(baseUrl);
          continue;
        }
        // Validate mediaSequence
        if (data.mediaSequence > variant.get("mediaSequence")) {
          error = `[${currTime}] Error in mediaSequence! (BW:${bw}) Expected mediaSequence >= ${data.mediaSequence}. Got: ${variant.get("mediaSequence")}`;
          console.error(`[${baseUrl}]${error}`);
          data.errors.push(error);
          continue;
        } else if (data.mediaSequence === variant.get("mediaSequence")) {
          data.newMediaSequence = data.mediaSequence;
          equalMseq = true;
        } else {
          data.newMediaSequence = variant.get("mediaSequence");
          data.newTime = Date.now();
        }
        // Validate playlist
        const currentSegUriList = variant.items.PlaylistItem.map((segItem) => segItem.get("uri"));
        if (equalMseq) {
          // Validate playlist Size
          if (data.fileSequences.length !== currentSegUriList.length) {
            error = `[${currTime}] Error in playlist! (BW:${bw}) Expected playlist size in mseq(${variant.get("mediaSequence")}) to be: ${data.fileSequences.length}. Got: ${currentSegUriList.length}`;
            console.error(`[${baseUrl}]${error}`);
            data.errors.push(error);
          }
          // Validate playlist contents
          for (let i = 0; i < currentSegUriList.length; i++) {
            if (data.fileSequences[i] !== currentSegUriList[i]) {
              error = `[${currTime}] Error in playlist! (BW:${bw}) Expected playlist item-uri in mseq(${variant.get("mediaSequence")}) at index(${i}) to be: '${data.fileSequences[i]}'. Got: '${currentSegUriList[i]}'`;
              console.error(`[${baseUrl}]${error}`);
              data.errors.push(error);
              break;
            }
          }
        } else {
          // Validate media sequence and file sequence
          const mseqDiff = variant.get("mediaSequence") - data.mediaSequence;
          if (mseqDiff < data.fileSequences.length) {
            const expectedfileSequences = data.fileSequences[mseqDiff];
            if (currentSegUriList[0] !== expectedfileSequences) {
              error = `[${currTime}] Error in playlist! (BW:${bw}) Expected first item-uri in mseq(${variant.get("mediaSequence")}) to be: '${expectedfileSequences}'. Got: '${currentSegUriList[0]}'`;
              console.error(`[${baseUrl}]${error}`);
              data.errors.push(error);
            }
          }
        }

        data.newfileSequences = currentSegUriList;

        // Validate discontinuitySequence
        if (data.nextIsDiscontinuity) {
          const mseqDiff = variant.get("mediaSequence") - data.mediaSequence;
          const expectedDseq = data.discontinuitySequence + 1;
          // Warn: Assuming that only ONE disc-tag has been removed between media-sequences
          if (mseqDiff === 1 && expectedDseq !== variant.get("discontinuitySequence")) {
            error = `[${currTime}] Error in discontinuitySequence! (BW:${bw}) Wrong count increment in mseq(${variant.get("mediaSequence")}) - Expected: ${expectedDseq}. Got: ${variant.get("discontinuitySequence")}`;
            console.error(`[${baseUrl}]${error}`);
            data.errors.push(error);
          }
        } else {
          // If the count increments too early...
          if (data.discontinuitySequence !== variant.get("discontinuitySequence")) {
            error = `[${currTime}] Error in discontinuitySequence! (BW:${bw}) Early count increment in mseq(${variant.get("mediaSequence")}) - Expected: ${data.discontinuitySequence}. Got: ${variant.get("discontinuitySequence")}`;
            console.error(`[${baseUrl}]${error}`);
            data.errors.push(error);
          }
        }
        data.newDiscontinuitySequence = variant.get("discontinuitySequence");
        data.nextIsDiscontinuity = variant.items.PlaylistItem[0].get("discontinuity");
      }
      // validate update interval (Stale manifest)
      const lastFetch = data.newTime ? data.newTime : data.lastFetch;
      const interval = Date.now() - lastFetch;
      if (interval > this.staleLimit) {
        error = `[${new Date().toISOString()}] Stale manifest! Expected: ${this.staleLimit}ms. Got: ${interval}ms`;
        console.error(`[${baseUrl}]${error}`);
        data.errors.push(error);
      }
      let currErrors = this.streamData.get(baseUrl).errors;
      currErrors.concat(data.errors);
      this.streamData.set(baseUrl, {
        mediaSequence: data.newMediaSequence,
        fileSequences: data.newfileSequences,
        nextIsDiscontinuity: data.nextIsDiscontinuity ? data.nextIsDiscontinuity : false,
        discontinuitySequence: data.newDiscontinuitySequence,
        lastFetch: data.newTime ? data.newTime : data.lastFetch,
        errors: currErrors,
      });
      error ? console.log(`[${new Date().toISOString()}] Master manifest paresed with error: ${this.getBaseUrl(streamUrl)}`) : console.log(`[${new Date().toISOString()}] Master manifest succefully paresed: ${this.getBaseUrl(streamUrl)}`);
      release();
    }
  }
}
