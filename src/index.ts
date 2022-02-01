import { HTTPManifestLoader } from "./manifest_loader";
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

  async getFails(): Promise<string[]> {
    let errors: string[] = [];
    let release = await this.lock.acquire();
    for (const [key, data] of this.streamData) {
      if (data.hasFailed) {
        errors.push(key);
      }
    }
    release();
    return errors;
  }

  async clearFails() {
    let release = await this.lock.acquire();
    for (const [key, data] of this.streamData) {
      if (data.hasFailed) {
        data.hasFailed = false;
        this.streamData[key].set(data);
      }
    }
    release();
  }

  stop() {
    if (this.state === State.INACTIVE) return;
    console.log("Stopping HLSMonitor");
    this.state = State.INACTIVE;
  }

  start() {
    if (this.state === State.ACTIVE) return;
    console.log("Starting HLSMonitor");
    this.state = State.ACTIVE;
  }

  private async parseManifests(streamUrls: any[]): Promise<void> {
    if (streamUrls.length === 0) {
      console.error("No stream urls to parse");
      return;
    }
    const manifestLoader = new HTTPManifestLoader();
    const interval = parseInt(process.env.HLS_MONITOR_INTERVAL || "6000");
    for (const manifest of streamUrls) {
      const masterM3U8 = await manifestLoader.load(manifest);
      let baseUrl: string;
      const m = manifest.match(/^(.*)\/.*?$/);
      if (m) {
        baseUrl = m[1] + "/";
      }
      let release = await this.lock.acquire();
      let data = this.streamData.get(baseUrl);
      for (const mediaM3U8 of masterM3U8.items.StreamItem) {
        const variant = await manifestLoader.load(
          `${baseUrl}${mediaM3U8.get("uri")}`
        );
        // Validate mediaSequence
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
          });
          data = this.streamData.get(baseUrl);
          continue;
        }
        if (data.mediaSequence > variant.get("mediaSequence")) {
          console.error(
            `wrong mediaSequence for ${baseUrl} Expected: ${
              data.mediaSequence
            } Got: ${variant.get("mediaSequence")}`
          );
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
            data.hasFailed = true;
            continue;
          }
        }
        data.newDiscontinuitySequence = variant.get("discontinuitySequence");
        data.nextIsDiscontinuity =
          variant.items.PlaylistItem[0].get("discontinuity");

        // validate update interval
        if (Date.now() - data.lastFetch > interval) {
          console.error(
            `wrong interval for ${baseUrl} Expected: ${interval} Got: ${
              Date.now() - data.lastFetch
            }`
          );
          data.hasFailed = true;
          continue;
        }
      }

      this.streamData.set(baseUrl, {
        mediaSequence: data.newMediaSequence,
        fileSequence: data.nextFileSequence,
        discontinuitySequence: data.newDiscontinuitySequence,
        lastFetch: data.newTime,
      });
      release();
    }
  }
}
