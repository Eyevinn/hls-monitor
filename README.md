# HLS Monitor

Service to monitor one or more HLS-streams for manifest errors and inconsistencies.
These are:

- Media sequence counter issues.
- Discontinuity sequence counter issues.
- Detect stale manifests. The default is at least 6000ms but can be configured via the env `HLS_MONITOR_INTERVAL` or set when creating a new HLSMonitor.
- Playlist is updating correctly.

## Setup

To initialize a new `HLSMonitorService` do:

```typescript
import { HLSMonitorService } from "@eyevinn/hls-monitor";

// initialize a new instance of HLSMonitorService
const hlsMonitorService = new HLSMonitorService();
// register the routes 
hlsMonitorService.listen(3000);
```

The monitor service is now up and running and available on port `3000`.
A basic Swagger doc can be accessed via `hls-monitor-endpoint/docs`

Start monitoring a new stream by doing a `POST` to `hls-monitor-endpoint/monitor` with the following payload:

```json
{
  "streams": ["stream-to-monitor/manifest.m3u8"]
}
```

It's also possible to set the interval (in milliseconds) for when a manifest should be considered as stale, this is done via:

```json
{
  "streams": ["stream-to-monitor/manifest.m3u8"],
  "stale_limit": 6000
}
```

To get the latest error for a specific monitor do a `GET` to `hls-monitor-endpoint/monitor/:monitorId/status`.

To remove a specific stream from a monitor do a `DELETE` to
`hls-monitor-endpoint/monitor/:monitorId` with the following payload:

```json
{
  "streams": ["streams-to-delete/manifest.m3u8"]
}
```

Available endpoints are:

| Endpoint                         | Method   | Description                                                 |
| -------------------------------- | -------- | ----------------------------------------------------------- |
| `/`                              | `GET`    | Heartbeat endpoint of service                               |
| `/monitor`                       | `POST`   | Start monitoring a new stream                               |
| `/monitor`                       | `GET`    | List all monitors                                           |
| `/monitor`                       | `DELETE` | Delete all monitored streams                                |
| `/monitor/:monitorId`            | `DELETE` | Delete a specific stream                                    |
| `/monitor/:monitorId/start`      | `POST`   | Start a specific monitor                                    |
| `/monitor/:monitorId/stop`       | `POST`   | Stop a specific monitor                                     |
| `/monitor/:monitorId/status`     | `GET`    | Get the current status of a stream                          |
| `/monitor/:monitorId/status`     | `GET`    | Delete the cached status of a stream                        |
| `/monitor/:monitorId/streams`    | `GET`    | Returns a list of all streams that are currently monitored  |
| `/monitor/:monitorId/streams`    | `PUT`    | Add a stream to the list of streams that will be monitored  |

The `HLSMonitorService` can also be controlled through code:

```typescript
import { HLSMonitorService } from "@eyevinn/hls-monitor";

// initialize a new instance of HLSMonitorService
const hlsMonitorService = new HLSMonitorService();

// create a new hls-monitor
const streams = ["streams-to-monitor/manifest.m3u8"];
hlsMonitorService.monitor.create(streams);

// Get latest errors
const errors = hlsMonitorService.monitor.getErrors();
console.log(errors);
```

## [Contributing](CONTRIBUTING.md)

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports, or asking for vital information such as version numbers or reproduction instructions.

## License (MIT)

Copyright 2022 Eyevinn Technology

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
