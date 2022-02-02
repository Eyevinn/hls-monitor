import { HTTPManifestLoader } from "./ManifestLoader";
import { Mutex } from "async-mutex";

enum State {
  IDLE = "idle",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export default class HLSMonitor {
  private streams: string[] = [];
  private state: State;
  private streamData = new Map<string, any>();
  private lock = new Mutex();

  constructor(hlsStreams: string[]) {
    this.streams = hlsStreams;
    this.state = State.IDLE;
  }

  async init(): Promise<void> {
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
      if (data.hasFailed) {
        errors.push({
          url: key,
          error: data.errorType,
        });
      }
    }
    release();
    return errors;
  }

  async clearErrors() {
    let release = await this.lock.acquire();
    for(const [key, data] of this.streamData.entries()) {
      if (data.hasFailed) {
        data.hasFailed = false;
        data.errorType = "";
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
    this.init();
  }

  async stop() {
    if (this.state === State.INACTIVE) return;
    this.state = State.INACTIVE;
    console.log("HLSMonitor stopped");
  }

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
    const interval = parseInt(process.env.HLS_MONITOR_INTERVAL || "6000");
    for (const streamUrl of streamUrls) {
      const masterM3U8 = await manifestLoader.load(streamUrl);
      let baseUrl = this.getBaseUrl(streamUrl);
      let release = await this.lock.acquire();
      let data = this.streamData.get(baseUrl);
      for (const mediaM3U8 of masterM3U8.items.StreamItem) {
        const variant = await manifestLoader.load(
          `${baseUrl}${mediaM3U8.get("uri")}`
        );
        let equalMseq = false;
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
            hasFailed: false,
            errorType: "",
          });
          data = this.streamData.get(baseUrl);
          continue;
        }
        // Validate mediaSequence
        if (data.mediaSequence > variant.get("mediaSequence")) {
          console.error(
            `wrong mediaSequence for ${baseUrl} Expected: ${
              data.mediaSequence
            } Got: ${variant.get("mediaSequence")}`
          );
          data.errorType = "media sequence counter";
          data.hasFailed = true;
          continue;
        } else if (data.mediaSequence === variant.get("mediaSequence")) {
          equalMseq = true;
        } else {
          data.newMediaSequence = variant.get("mediaSequence");
          data.newTime = Date.now();
        }
        // Validate playlist
        if (
          data.fileSequence === variant.items.PlaylistItem[0].get("uri") &&
          !equalMseq
        ) {
          console.error(
            `wrong playlist for ${baseUrl} Expected: ${
              data.fileSequence
            } Got: ${variant.items.PlaylistItem[0].get("uri")}`
          );
          data.errorType = "playlist";
          data.hasFailed = true;
          continue;
        }

        data.newFileSequence = variant.items.PlaylistItem[0].get("uri");

        // Validate discontinuitySequence
        if (data.nextIsDiscontinuity) {
          if (
            data.DiscontinuitySequence >= variant.get("discontinuitySequence")
          ) {
            console.error(
              `wrong discontinuitySequence for ${baseUrl} Expected: ${
                data.DiscontinuitySequence
              } Got: ${variant.get("discontinuitySequence")}`
            );
            data.errorType = "discontinuity sequence counter";
            data.hasFailed = true;
            continue;
          }
        }
        data.newDiscontinuitySequence = variant.get("discontinuitySequence");
        data.nextIsDiscontinuity = variant.items.PlaylistItem[0].get("discontinuity");
        // validate update interval
        if (Date.now() - data.lastFetch > interval) {
          console.error(
            `wrong interval for ${baseUrl} Expected: ${interval} Got: ${
              Date.now() - data.lastFetch
            }`
          );
          data.errorType = "update interval";
          data.hasFailed = true;
          continue;
        }
      }
      this.streamData.set(baseUrl, {
        mediaSequence: data.newMediaSequence,
        fileSequence: data.nextFileSequence,
        discontinuitySequence: data.newDiscontinuitySequence,
        lastFetch: data.newTime,
        hasFailed: data.hasFailed,
        errorType: data.errorType,
      });
      release();
    }
  }
}
