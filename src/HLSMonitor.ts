import { HTTPManifestLoader } from "./ManifestLoader";
import { Mutex } from "async-mutex";

const timer = (ms) => new Promise((res) => setTimeout(res, ms));
enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export class HLSMonitor {
  private streams: string[] = [];
  private state: State;
  private streamData = new Map<string, any>();
  private staleLimit: number;
  private updateInterval: number;
  private lock = new Mutex();
  private id: number;

  /**
    * @param hlsStreams The streams to monitor.
    * @param [staleLimit] The monitor interval for streams overrides the default (6000ms) monitor interval and the HLS_MONITOR_INTERVAL environment variable.
    */
  constructor(hlsStreams: string[], staleLimit?: number) {
    this.streams = hlsStreams;
    this.state = State.IDLE;
    if (staleLimit) {
      this.staleLimit = staleLimit;
    } else {
      this.staleLimit = parseInt(process.env.HLS_MONITOR_INTERVAL || "6000");
    }
    console.log(`Stale-limit: ${this.staleLimit}`);
    this.updateInterval = staleLimit/2;
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
  getId(): number {
    return this.id
  }

  async getErrors(): Promise<Object[]> {
    let errors: Object[] = [];
    let release = await this.lock.acquire();
    for(const [key, data] of this.streamData.entries()) {
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
    for(const [key, data] of this.streamData.entries()) {
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
    console.log(`List of streams updated for ${this.id}. Current streams ${this.streams}`)
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
        console.log(`Removed stream: ${baseUrl} from monitor: ${this.id}`)
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
          variant = await manifestLoader.load(`${baseUrl}${mediaM3U8.get("uri")}`)
        } catch (error) {
          release();
          return error
        }
          
        let equalMseq = false;
        const bw = variant.get("bandwidth");
        const currTime = new Date().toISOString();
        if (!data) {
          this.streamData.set(baseUrl, {
            mediaSequence: variant.get("mediaSequence"),
            newMediaSequence: 0,
            fileSequence: "",
            newFileSequence: "",
            discontinuitySequence: variant.get("discontinuitySequence"),
            newDiscontinuitySequence: 0,
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
          error = `[${currTime}] Error in mediaSequence! Expected: ${data.mediaSequence} Got: ${variant.get("mediaSequence")} BW: ${bw}`;
          console.error(`[${baseUrl}]${error}`);
          continue;
        } else if (data.mediaSequence === variant.get("mediaSequence")) {
          data.newMediaSequence = data.mediaSequence;
          equalMseq = true;
        } else {
          data.newMediaSequence = variant.get("mediaSequence");
          data.newTime = Date.now();
        }
        // Validate playlist
        if (data.fileSequence === variant.items.PlaylistItem[0].get("uri") && !equalMseq) {
          error = `[${currTime}] Error in playlist! Expected: ${data.fileSequence} Got: ${variant.items.PlaylistItem[0].get("uri")} BW: ${bw}`;
          console.error(`[${baseUrl}]${error}`);
          data.error.push(error);
        }

        data.newFileSequence = variant.items.PlaylistItem[0].get("uri");

        // Validate discontinuitySequence
        if (data.nextIsDiscontinuity) {
          if (data.DiscontinuitySequence >= variant.get("discontinuitySequence")) {
            error = `[${currTime}] Error in discontinuitySequence! Expected: ${data.DiscontinuitySequence} Got: ${variant.get("discontinuitySequence")} BW: ${bw}`;
            console.error(`[${baseUrl}]${error}`);
            data.error.push(error);
          }
        }
        data.newDiscontinuitySequence = variant.get("discontinuitySequence");
        data.nextIsDiscontinuity = variant.items.PlaylistItem[0].get("discontinuity");
      }
      // validate update interval (Stale manifest)
      const lastFetch = data.newTime ? data.newTime : data.lastFetch
      const interval = (Date.now() - lastFetch);
      if (interval > this.staleLimit) {
        error = `[${new Date().toISOString()}] Stale manifest! Expected: ${this.staleLimit}ms Got: ${interval}ms`;
        console.error(`[${baseUrl}]${error}`);
        data.errors.push(error);
      }
      let currErrors = this.streamData.get(baseUrl).errors;
      currErrors.concat(data.errors);
      this.streamData.set(baseUrl, {
        mediaSequence: data.newMediaSequence,
        fileSequence: data.nextFileSequence,
        discontinuitySequence: data.newDiscontinuitySequence,
        lastFetch: data.newTime ? data.newTime : data.lastFetch,
        errors: currErrors,
      });
      error ? console.log(`[${new Date().toISOString()}] Master manifest paresed with error: ${this.getBaseUrl(streamUrl)}`) : console.log(`[${new Date().toISOString()}] Master manifest succefully paresed: ${this.getBaseUrl(streamUrl)}`);
      release();
    }
  }
}
