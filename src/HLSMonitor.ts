import { HTTPManifestLoader } from "./ManifestLoader";
import { Mutex } from "async-mutex";
const { v4: uuidv4 } = require("uuid");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
export enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

const ERROR_LIMIT = 10 || process.env.ERROR_LIMIT;

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
  mediaSequence?: number;
  newMediaSequence?: number;
  fileSequences?: SegmentURI[];
  newFileSequences?: SegmentURI[];
  discontinuitySequence?: number;
  newDiscontinuitySequence?: number;
  nextIsDiscontinuity?: boolean;
  prevM3U?: M3U;
};
type StreamData = {
  variants?: { [bandwidth: number]: VariantData };
  lastFetch?: number;
  newTime?: number;
  errors?: string[];
};

export class HLSMonitor {
  private streams: string[] = [];
  private state: State;
  private streamData = new Map<string, StreamData>();
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
      let masterM3U8: M3U;
      try {
        masterM3U8 = await manifestLoader.load(streamUrl);
      } catch (error) {
        console.error(error);
        console.log("Failed to fetch stream url:", streamUrl);
        continue;
      }
      let baseUrl = this.getBaseUrl(streamUrl);
      let release = await this.lock.acquire();
      let data: StreamData = this.streamData.get(baseUrl);
      if (!data) {
        data = {
          variants: {},
        };
      }
      let error: string;
      for (const mediaM3U8 of masterM3U8.items.StreamItem) {
        let variant: M3U;
        try {
          variant = await manifestLoader.load(`${baseUrl}${mediaM3U8.get("uri")}`);
        } catch (error) {
          release();
          return error;
        }
        let equalMseq = false;
        const bw: number = mediaM3U8.get("bandwidth");
        const currTime = new Date().toISOString();
        if (!data.variants[bw]) {
          data.variants[bw] = {
            mediaSequence: null,
            newMediaSequence: null,
            fileSequences: null,
            newFileSequences: null,
            discontinuitySequence: null,
            newDiscontinuitySequence: null,
            nextIsDiscontinuity: null,
            prevM3U: null,
          };
          data.variants[bw].mediaSequence = variant.get("mediaSequence");
          data.variants[bw].newMediaSequence = 0;
          data.variants[bw].fileSequences = variant.items.PlaylistItem.map((segItem) => segItem.get("uri"));
          data.variants[bw].newFileSequences = variant.items.PlaylistItem.map((segItem) => segItem.get("uri"));
          data.variants[bw].discontinuitySequence = variant.get("discontinuitySequence");
          data.variants[bw].newDiscontinuitySequence = variant.get("discontinuitySequence");
          data.variants[bw].nextIsDiscontinuity = false;
          data.variants[bw].prevM3U = variant;
          data.lastFetch = Date.now();
          data.newTime = Date.now();
          data.errors = [];
          this.streamData.set(baseUrl, data);
          continue;
        }
        // Validate mediaSequence
        if (data.variants[bw].mediaSequence > variant.get("mediaSequence")) {
          error = `[${currTime}] Error in mediaSequence! (BW:${bw}) Expected mediaSequence >= ${data.variants[bw].mediaSequence}. Got: ${variant.get("mediaSequence")}`;
          console.error(`[${baseUrl}]${error}`);
          if (data.errors.length < ERROR_LIMIT) {
            data.errors.push(error);
          } else if (data.errors.length > 0) {
            data.errors.shift();
            data.errors.push(error);
          }
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
            error = `[${currTime}] Error in playlist! (BW:${bw}) Expected playlist size in mseq(${variant.get("mediaSequence")}) to be: ${
              data.variants[bw].fileSequences.length
            }. Got: ${currentSegUriList.length}`;
            console.error(`[${baseUrl}]${error}`);
            if (data.errors.length < ERROR_LIMIT) {
              data.errors.push(error);
            } else if (data.errors.length > 0) {
              data.errors.shift();
              data.errors.push(error);
            }
          } else if (data.variants[bw].fileSequences.length === currentSegUriList.length) {
            // Validate playlist contents
            for (let i = 0; i < currentSegUriList.length; i++) {
              if (data.variants[bw].fileSequences[i] !== currentSegUriList[i]) {
                // [!] Compare the end of filename instead...
                let shouldBeSegURI = new URL("http://.mock.com/" + data.variants[bw].fileSequences[i]).pathname.slice(-5);
                let newSegURI = new URL("http://.mock.com/" + currentSegUriList[i]).pathname.slice(-5);
                if (newSegURI !== shouldBeSegURI) {
                  error = `[${currTime}] Error in playlist! (BW:${bw}) Expected playlist item-uri in mseq(${variant.get("mediaSequence")}) at index(${i}) to be: '${
                    data.variants[bw].fileSequences[i]
                  }'. Got: '${currentSegUriList[i]}'`;
                  console.error(`[${baseUrl}]${error}`);
                  if (data.errors.length < ERROR_LIMIT) {
                    data.errors.push(error);
                  } else if (data.errors.length > 0) {
                    data.errors.shift();
                    data.errors.push(error);
                  }
                  break;
                }
              }
            }
          }
        } else {
          // Validate media sequence and file sequence
          const mseqDiff = variant.get("mediaSequence") - data.variants[bw].mediaSequence;
          if (mseqDiff < data.variants[bw].fileSequences.length) {
            const expectedfileSequence = data.variants[bw].fileSequences[mseqDiff];

            // if (currentSegUriList[0] !== expectedfileSequence) {
            //   error = `[${currTime}] Error in playlist! (BW:${bw}) Faulty Segment Continuity! Expected first item-uri in mseq(${variant.get(
            //     "mediaSequence"
            //   )}) to be: '${expectedfileSequence}'. Got: '${currentSegUriList[0]}'`;
            //   console.error(`[${baseUrl}]${error}`);
            //   data.errors.push(error);
            // }

            // [!] Compare the end of filename instead...
            let shouldBeSegURI = new URL("http://.mock.com/" + expectedfileSequence).pathname.slice(-5);
            let newSegURI = new URL("http://.mock.com/" + currentSegUriList[0]).pathname.slice(-5);
            if (newSegURI !== shouldBeSegURI) {
              error = `[${currTime}] Error in playlist! (BW:${bw}) Faulty Segment Continuity! Expected first item-uri in mseq(${variant.get(
                "mediaSequence"
              )}) to be: '${expectedfileSequence}'. Got: '${currentSegUriList[0]}'`;
              console.error(`[${baseUrl}]${error}`);
              if (data.errors.length < ERROR_LIMIT) {
                data.errors.push(error);
              } else if (data.errors.length > 0) {
                data.errors.shift();
                data.errors.push(error);
              }
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
            error = `[${currTime}] Error in discontinuitySequence! (BW:${bw}) Wrong count increment in mseq(${variant.get(
              "mediaSequence"
            )}) - Expected: ${expectedDseq}. Got: ${variant.get("discontinuitySequence")}`;
            console.error(`[${baseUrl}]${error}`);
            if (data.errors.length < ERROR_LIMIT) {
              data.errors.push(error);
            } else if (data.errors.length > 0) {
              data.errors.shift();
              data.errors.push(error);
            }
          }
        } else {
          // Case where mseq stepped larger than 1. Check if dseq incremented properly
          if (data.variants[bw].discontinuitySequence !== variant.get("discontinuitySequence")) {
            const dseqDiff = variant.get("discontinuitySequence") - data.variants[bw].discontinuitySequence;
            let foundDiscCount: number = discontinuityOnTopItem ? -1 : 0;
            // dseq step should match amount of disc-tags found in prev mseq playlist
            for (let i = 0; i < mseqDiff + 1; i++) {
              let segHasDisc = data.variants[bw].prevM3U.items.PlaylistItem[i].get("discontinuity");
              if (segHasDisc) {
                foundDiscCount++;
              }
            }
            if (dseqDiff !== foundDiscCount) {
              error = `[${currTime}] Error in discontinuitySequence! (BW:${bw}) Early count increment in mseq(${variant.get("mediaSequence")}) - Expected: ${
                data.variants[bw].discontinuitySequence
              }. Got: ${variant.get("discontinuitySequence")}`;
              console.error(`[${baseUrl}]${error}`);
              if (data.errors.length < ERROR_LIMIT) {
                data.errors.push(error);
              } else if (data.errors.length > 0) {
                data.errors.shift();
                data.errors.push(error);
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
        error = `[${new Date().toISOString()}] Stale manifest! Expected: ${this.staleLimit}ms. Got: ${interval}ms`;
        console.error(`[${baseUrl}]${error}`);
        if (data.errors.length < ERROR_LIMIT) {
          data.errors.push(error);
        } else if (data.errors.length > 0) {
          data.errors.shift();
          data.errors.push(error);
        }
      }
      let currErrors = this.streamData.get(baseUrl).errors;
      currErrors.concat(data.errors);
      this.streamData.set(baseUrl, {
        variants: data.variants,
        lastFetch: data.newTime ? data.newTime : data.lastFetch,
        errors: currErrors,
      });
      if (error) {
        console.log(`[${new Date().toISOString()}] Master manifest loaded with error: ${this.getBaseUrl(streamUrl)}`);
      } else {
        // console.log(`[${new Date().toISOString()}] Master manifest succefully loaded: ${this.getBaseUrl(streamUrl)}`);
      }
      release();
    }
  }
}
