# HLS Monitor 📺🔍📊

Service to monitor one or more HLS streams for manifest errors and inconsistencies.
These are:

- Media sequence counter issues.
- Discontinuity sequence counter issues.
- Detect stale manifests. The default is at least 6000ms but can be configured via the env `HLS_MONITOR_INTERVAL` or set when creating a new HLSMonitor.
The playlist is updating correctly.

<div align="center">
<br />

[![Badge OSC](https://img.shields.io/badge/Evaluate-24243B?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8yODIxXzMxNjcyKSIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI3IiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjIiLz4KPGRlZnM%2BCjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhcl8yODIxXzMxNjcyIiB4MT0iMTIiIHkxPSIwIiB4Mj0iMTIiIHkyPSIyNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzE4M0ZGIi8%2BCjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzREQzlGRiIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM%2BCjwvc3ZnPgo%3D)](https://app.osaas.io/browse/eyevinn-hls-monitor)

</div>

## Command Line Executable

To run HLS monitor first install the executable:

```
npm install -g @eyevinn/hls-monitor
```

Then run:

```
hls-monitor URL-TO-MONITOR
```

## Setup

To initialize a new `HLSMonitorService` do the following:

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
| `/monitor/:monitorId`            | `DELETE` | Delete a specific monitor and its streams                   |
| `/monitor/:monitorId/start`      | `POST`   | Start a specific monitor                                    |
| `/monitor/:monitorId/stop`       | `POST`   | Stop a specific monitor                                     |
| `/monitor/:monitorId/status`     | `GET`    | Get the current status of a stream                          |
| `/monitor/:monitorId/status`     | `DELETE` | Delete the cached status of a stream                        |
| `/monitor/:monitorId/streams`    | `GET`    | Returns a list of all streams that are currently monitored  |
| `/monitor/:monitorId/streams`    | `PUT`    | Add a stream to the list of streams that will be monitored  |
| `/monitor/:monitorId/streams`    | `DELETE` | Remove streams from the monitor                             |
| `/metrics`                       | `GET`    | Get OpenMetrics/Prometheus compatible metrics               |
| `/docs`                          | `GET`    | Swagger documentation UI                                    |
A few environment variables can be set to configure the service:

```text
HLS_MONITOR_INTERVAL=6000 # Interval in milliseconds for when a manifest should be considered stale
ERROR_LIMIT=10 # number of errors to be saved in memory
```

The `HLSMonitorService` can also be controlled through code by using the core `HLSMonitor` directly:

```typescript
import { HLSMonitor } from "@eyevinn/hls-monitor";

// Define a list of streams
const streams = ["stream-to-monitor-01/manifest.m3u8", "stream-to-monitor-02/manifest.m3u8"];

// Define stale limit in milliseconds (Defaults at 6000)
const staleLimit = 10000;

// initialize a new instance of HLSMonitor
const monitor = new HLSMonitor(streams, staleLimit);

// Start the HLS-Monitor, it will begin polling and analyzing new manifests. 
monitor.start();

// ... after some time, check for the latest errors
const errors = await monitor.getErrors();
console.log(errors);
```

## Error Structure

When calling `getErrors()`, the monitor returns an array of error objects in reverse chronological order (newest first). Each error object has the following structure:

```typescript
type MonitorError = {
  eid: string;          // Unique error ID
  date: string;         // ISO timestamp of when the error occurred
  errorType: ErrorType; // Type of error (e.g., "Manifest Retrieval", "Media Sequence", etc.)
  mediaType: string;    // Type of media ("MASTER", "VIDEO", "AUDIO", etc.)
  variant: string;      // Variant identifier (bandwidth or group-id)
  details: string;      // Detailed error message
  streamUrl: string;    // URL of the stream where the error occurred
  streamId: string;     // ID of the stream
  code?: number;        // HTTP status code (for manifest retrieval errors)
}

enum ErrorType {
  MANIFEST_RETRIEVAL = "Manifest Retrieval",
  MEDIA_SEQUENCE = "Media Sequence",
  PLAYLIST_SIZE = "Playlist Size",
  PLAYLIST_CONTENT = "Playlist Content",
  SEGMENT_CONTINUITY = "Segment Continuity",
  DISCONTINUITY_SEQUENCE = "Discontinuity Sequence",
  STALE_MANIFEST = "Stale Manifest"
}
```

Example error object:
```json
{
  "eid": "eid-1234567890",
  "date": "2024-01-30T12:34:56.789Z",
  "errorType": "Manifest Retrieval",
  "mediaType": "VIDEO",
  "variant": "1200000",
  "details": "Failed to fetch variant manifest (404)",
  "streamUrl": "https://example.com/stream.m3u8",
  "streamId": "stream_1",
  "code": 404
}
```

## Metrics

The service exposes a `/metrics` endpoint that provides OpenMetrics/Prometheus-compatible metrics. These metrics can be used to monitor the health and status of your HLS streams in real-time.

### Available Metrics

```text
# HELP hls_monitor_info Information about the HLS monitor
# TYPE hls_monitor_info gauge
hls_monitor_info{monitor_id="...", state="active"} 1

# HELP hls_monitor_manifest_fetch_errors Current manifest fetch errors with details
# TYPE hls_monitor_manifest_fetch_errors gauge
hls_monitor_manifest_fetch_errors{monitor_id="...",url="...",status_code="404",media_type="VIDEO",variant="1200000",stream_id="..."} 1

# HELP hls_monitor_stream_total_errors Total number of errors detected per stream since monitor creation
# TYPE hls_monitor_stream_total_errors counter
hls_monitor_stream_total_errors{monitor_id="...",stream_id="..."} 42

# HELP hls_monitor_stream_time_since_last_error_seconds Time since the last error was detected for each stream
# TYPE hls_monitor_stream_time_since_last_error_seconds gauge
hls_monitor_stream_time_since_last_error_seconds{monitor_id="...",stream_id="..."} 1234.56

# HELP hls_monitor_new_errors_total Count of new errors detected since last check
# TYPE hls_monitor_new_errors_total counter
hls_monitor_new_errors_total{monitor_id="...",error_type="Manifest Retrieval",media_type="VIDEO",stream_id="..."} 1
```

### Using with Prometheus and Grafana

These metrics can be scraped by Prometheus and visualized in Grafana. We provide example configurations and a demo dashboard in the `examples/local-grafana-dashboards` directory.

To get started with monitoring:

1. Configure Prometheus to scrape the `/metrics` endpoint
2. Import our demo Grafana dashboard
3. Start monitoring your streams with real-time visualizations

See our [local Grafana setup guide](examples/local-grafana-dashboards/how-to-setup-local-grafana.md) for detailed instructions.

## [Contributing](CONTRIBUTING.md)

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports or asking for vital information such as version numbers or reproduction instructions.

## License (MIT)

Copyright 2024 Eyevinn Technology

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

Join our [community on Slack](http://slack.streamingtech.se) where you can post any questions regarding any of our open-source projects. Eyevinn's consulting business can also offer you:

- Further development of this component
- Customization and integration of this component into your platform
- Support and maintenance agreement

Contact [sales@eyevinn.se](mailto:sales@eyevinn.se) if you are interested.

## About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specializing in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This gives us room for innovation, team building, and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
