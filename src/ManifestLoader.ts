import fetch from "node-fetch";
import { Readable } from "stream";
import m3u8 from "@eyevinn/m3u8";

export interface IManifestLoader {
  load: (uri: string) => Promise<any>;
}

class AbstractManifestParser {
  parse(stream: Readable): Promise<any> {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();
      parser.on("m3u", m3u => {
        resolve(m3u);
      });
      parser.on("error", err => {
        reject("Failed to parse manifest: " + err);
      });
      try {
        stream.pipe(parser);
      } catch (err) {
        reject("Failed to fetch manifest: " + err);
      }
    });
  }
}

export class HTTPManifestLoader extends AbstractManifestParser implements IManifestLoader {
  load(uri: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(uri);
      fetch(url.href)
      .then(response => {
        if (response.ok) {
          this.parse(response.body as Readable).then(resolve);
        } else {
          console.log(`Failed to fetch manifest (${response.status}): ` + response.statusText);
          reject({statusCode: response.status, statusText: response.statusText});
        }
      })
      .catch(reject);
    });    
  }
}
