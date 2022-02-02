import { HTTPManifestLoader } from "./ManifestLoader";
import { Mutex } from "async-mutex";

enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export class HLSMonitor {
  private streams: string[] = [];
  private state: State;
  private streamData = new Map<string, any>();
  private interval: number;
  private lock = new Mutex();

  /**
    * @param hlsStreams The streams to monitor.
    * @param [monitorInterval] The monitor interval for streams overrides the default (6000ms) monitor interval and the HLS_MONITOR_INTERVAL environment variable.
    */
  constructor(hlsStreams: string[], monitorInterval?: number) {
    this.streams = hlsStreams;
    this.state = State.IDLE;
    if (monitorInterval) {
      this.interval = monitorInterval;
    } else {
      this.interval = parseInt(process.env.HLS_MONITOR_INTERVAL || "6000");
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
      } catch (error) {
        console.error(error);
        this.state = State.INACTIVE;
      }
    }
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
    console.log("Starting HLSMonitor");
    this.create();
  }

  async stop() {
    if (this.state === State.INACTIVE) return;
    this.state = State.INACTIVE;
    console.log("HLSMonitor stopped");
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
        const variant = await manifestLoader.load(
          `${baseUrl}${mediaM3U8.get("uri")}`
        );
        let equalMseq = false;
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
          error = `[${currTime}] Wrong mediaSequence! Expected: ${data.mediaSequence} Got: ${variant.get("mediaSequence")}`;
          console.error(`[${baseUrl}]${error}`);
          continue;
        } else if (data.mediaSequence === variant.get("mediaSequence")) {
          equalMseq = true;
        } else {
          data.newMediaSequence = variant.get("mediaSequence");
          data.newTime = Date.now();
        }
        // Validate playlist
        if (data.fileSequence === variant.items.PlaylistItem[0].get("uri") && !equalMseq) {
          error = `[${currTime}] Wrong playlist! Expected: ${data.fileSequence} Got: ${variant.items.PlaylistItem[0].get("uri")}`;
          console.error(`[${baseUrl}]${error}`);
          data.error.push(error);
          continue;
        }

        data.newFileSequence = variant.items.PlaylistItem[0].get("uri");

        // Validate discontinuitySequence
        if (data.nextIsDiscontinuity) {
          if (data.DiscontinuitySequence >= variant.get("discontinuitySequence")) {
            error = `[${currTime}] Wrong discontinuitySequence! Expected: ${data.DiscontinuitySequence} Got: ${variant.get("discontinuitySequence")}`
            console.error(`[${baseUrl}]${error}`);
            data.error.push(error);
            continue;
          }
        }
        data.newDiscontinuitySequence = variant.get("discontinuitySequence");
        data.nextIsDiscontinuity = variant.items.PlaylistItem[0].get("discontinuity");
        // validate update interval
        if (Date.now() - data.lastFetch > this.interval) {
          error = `[${currTime}] Stale manifest! Expected: ${this.interval} Got: ${Date.now() - data.lastFetch}`
          console.error(`[${baseUrl}]${error}`);
          data.errors.push(error);
          continue;
        }
      }
      let currErrors = this.streamData.get(baseUrl).errors;
      currErrors.concat(data.errors);
      this.streamData.set(baseUrl, {
        mediaSequence: data.newMediaSequence,
        fileSequence: data.nextFileSequence,
        discontinuitySequence: data.newDiscontinuitySequence,
        lastFetch: data.newTime,
        errors: currErrors,
      });
      release();
    }
  }
}
