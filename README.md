# hls-monitor

Service to monitor one or more hls streams for manifest errors and inconsistencies.  

## Setup

To initialise a new `HLSMonitorService` do: 

```typescript
import HLSMonitorService from './routes';

// initialise a new instance of HLSMonitorService
const hlsMonitorService = new HLSMonitorService();
// register the routes 
hlsMonitorService.listen(3000);
```
The monitor service is now up and running and avaliable on port `3000`.
A basic Swagger doc can be accessed via `hls-monitor-endpoint/docs`

Start monitoring a new stream by doing a `PUT` to `hls-monitor-endpoint/create` with the following payload: 

```json
{
    "streams": ["streams-to-monitor.m3u8"]
}
```

To get the latest error do a `GET` to `hls-monitor-endpoint/status`. 

To stop monitoring a specific stream do a `PUT` to 
`hls-monitor-endpoint/delete` with the followin payload:

```json
{
    "streams": ["streams-to-delete.m3u8"]
}
```

Avaliable endpoints are: 

`PUT` /create

`PUT` /delete

`GET` /status

`GET` /clearerrors

`GET` /streams

`GET` /healthcheck

`GET` /start

`GET` /stop

Currently only the latest error type is recorded for a stream. However all error types are being logged.

# [Contributing](CONTRIBUTING.md)

In addition to contributing code, you can help to triage issues. This can include reproducing bug reports, or asking for vital information such as version numbers or reproduction instructions.

# License (MIT)

Copyright 2022 Eyevinn Technology

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!
