import Fastify from "fastify";
import { HLSMonitor } from "./HLSMonitor";
import { ErrorType } from "./HLSMonitor";
import { State } from "./HLSMonitor";

export class HLSMonitorService {
  private fastify: any;
  private hlsMonitors = new Map<string, HLSMonitor>();

  constructor() {
    this.fastify = Fastify({
      logger: true,
      ignoreTrailingSlash: true,
    });
  }

  get monitors() {
    return this.hlsMonitors;
  }

  private async routes() {
    this.fastify.register(require("fastify-swagger"), {
      routePrefix: "/docs",
      swagger: {
        info: {
          title: "HLS Monitor",
          description: "HLSMonitor API",
          version: "0.0.1",
        },
        consumes: ["application/json"],
        produces: ["application/json"],
      },
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
      uiHooks: {
        onRequest: function (request, reply, next) {
          next();
        },
        preHandler: function (request, reply, next) {
          next();
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      exposeRoute: true,
    });

    const StreamInput = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        url: { type: 'string' }
      },
      required: ['url']
    };

    const MonitorBody = {
      type: 'object',
      required: ['streams'],
      properties: {
        streams: {
          type: 'array',
          items: {
            oneOf: [
              { type: 'string' },
              StreamInput
            ]
          }
        },
        stale_limit: {
          type: 'number',
          nullable: true,
          default: 6000
        },
        monitor_interval: {
          type: 'number',
          nullable: true
        }
      },
      example: {
        streams: [
          "http://example.com/master.m3u8",
          {
            id: "custom_stream_1",
            url: "http://example.com/master2.m3u8"
          }
        ],
        stale_limit: 6000,
        monitor_interval: 3000
      }
    };

    const MonitorResponse = {
      type: 'object',
      properties: {
        status: { type: 'string' },
        streams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        monitorId: { type: 'string' },
        stale_limit: { type: 'number' },
        monitor_interval: { type: 'number' }
      },
      example: {
        status: "Created a new hls-monitor",
        streams: [
          {
            id: "stream_1",
            url: "http://example.com/master.m3u8"
          },
          {
            id: "custom_stream",
            url: "http://example.com/master2.m3u8"
          }
        ],
        monitorId: "550e8400-e29b-41d4-a716-446655440000",
        stale_limit: 6000,
        monitor_interval: 3000
      }
    };

    const StreamsResponse = {
      type: 'object',
      properties: {
        streams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' }
            }
          }
        }
      },
      example: {
        streams: [
          {
            id: "stream_1",
            url: "http://example.com/master.m3u8"
          },
          {
            id: "custom_stream",
            url: "http://example.com/master2.m3u8"
          }
        ]
      }
    };

    const UpdateStreamsResponse = {
      type: 'object',
      properties: {
        message: { type: 'string' },
        streams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              url: { type: 'string' }
            }
          }
        }
      },
      example: {
        message: "Added streams to monitor",
        streams: [
          {
            id: "stream_1",
            url: "http://example.com/master.m3u8"
          },
          {
            id: "custom_stream",
            url: "http://example.com/master2.m3u8"
          }
        ]
      }
    };

    this.fastify.post("/monitor", 
    {
      schema: { 
        description: "Start monitoring new streams. Supports both simple URL strings and objects with custom IDs", 
        body: MonitorBody,
        response: {
            '200': MonitorResponse,
            '400': {
              type: 'object',
              properties: {
                status: { type: 'string' },
                message: { type: 'string' }
              }
            }
        }
      } 
    }, 
    async (request, reply) => {
      const body = request.body;
        
      // Check for duplicate URLs
      const urls = body.streams.map(s => typeof s === 'string' ? s : s.url);
      const uniqueUrls = [...new Set(urls)];
      if (uniqueUrls.length !== urls.length) {
        reply.code(400).send({
          status: "error",
          message: "Duplicate stream URLs are not allowed within the same monitor"
        });
        return;
      }
  
      let monitor;
      let monitorOptions = { staleLimit: 6000, monitorInterval: 3000, logConsole: false };
      if (body["stale_limit"]) {
        monitorOptions.staleLimit = body["stale_limit"];
      }
      if (body["monitor_interval"]) {
        monitorOptions.monitorInterval = body["monitor_interval"];
      }
      monitor = new HLSMonitor(body["streams"], monitorOptions);
      monitor.create();
      this.hlsMonitors.set(monitor.monitorId, monitor);
      const rep = {
        status: "Created a new hls-monitor",
        streams: body["streams"],
      };
      if (body["stale_limit"]) {
        rep["stale_limit"] = body["stale_limit"];
      }
      if (body["monitor_interval"]) {
        rep["monitor_interval"] = body["monitor_interval"];
      }
      rep["monitorId"] = monitor.monitorId;
      reply.code(201).header("Content-Type", "application/json; charset=utf-8").send(rep);
    });

    this.fastify.get("/monitor", async (request, reply) => {
      if (!this.hlsMonitors) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      let monitorInfo: any = {}

      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        monitorInfo[monitorId] = {
          createdAt: monitor.getCreatedAt(),
          streams: monitor.getStreams(),
          state: monitor.getState(),
          errorCount: (await monitor.getErrors()).length,
          statusEndpoint: `/monitor/${monitorId}/status`,
        }
      }
      reply
        .code(200)
        .header("Content-Type", "application/json; charset=utf-8")
        .send(JSON.stringify(monitorInfo));
    });

    this.fastify.get("/monitor/:monitorId/streams", 
    {
      schema: {
        description: "Returns a list of all streams that are currently monitored",
        params: { 
          monitorId: { type: 'string' }
        },
        response: {
          '200': StreamsResponse,
          '404': {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }, 
    async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
        return;
      }
      reply.send({ streams: this.hlsMonitors.get(request.params.monitorId).getStreams() });
    });

    this.fastify.put("/monitor/:monitorId/streams",
    {
      schema: {
        description: "Add streams to the list of streams that will be monitored. Supports both URL strings and objects with custom IDs",
        params: { 
          monitorId: { type: 'string' }
        },
        body: {
          type: 'object',
          required: ['streams'],
          properties: {
            streams: {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  StreamInput
                ]
              }
            },
          },
          example: {
            streams: [
              "http://example.com/master.m3u8",
              {
                id: "custom_stream_1",
                url: "http://example.com/master2.m3u8"
              }
            ],
          }
        },
        response: {
          '201': UpdateStreamsResponse,
          '400': {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' }
            }
          },
          '500': {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
        return;
      }

      const monitor = this.hlsMonitors.get(request.params.monitorId);
      
      // Extract URLs from both string and object formats
      const newUrls = request.body.streams.map(s => typeof s === 'string' ? s : s.url);
      
      // Check for duplicates within the new streams
      const uniqueNewUrls = [...new Set(newUrls)];
      if (uniqueNewUrls.length !== newUrls.length) {
        reply.code(400).send({
          status: "error",
          message: "Duplicate stream URLs are not allowed within the same monitor"
        });
        return;
      }

      // Check against existing streams
      const currentUrls = monitor.getStreams();
      const alreadyMonitored = newUrls.filter(url => currentUrls.includes(url));
      
      if (alreadyMonitored.length > 0) {
        reply.code(400).send({
          status: "error",
          message: `${alreadyMonitored.length} stream(s) are already being monitored`
        });
        return;
      }

      const streams = await monitor.update(request.body.streams);
      
      reply.code(201).send(JSON.stringify({
        message: "Added streams to monitor",
        streams: streams
      }));
    });

    this.fastify.delete("/monitor/:monitorId/stream", 
    {
      schema: {
        description: "Remove a stream from the monitor",
        params: { 
          monitorId: { type: 'string' }
        },
        querystring: {
          type: 'object',
          required: ['streamId'],
          properties: {
            streamId: { type: 'string' }
          }
        },
        response: {
          '200': {
            type: 'object',
            properties: {
              message: { type: 'string' },
              streams: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    url: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized"
        });
        return;
      }

      try {
        const remainingStreams = await this.hlsMonitors
          .get(request.params.monitorId)
          .removeStream(request.query.streamId);

        reply.code(200).send({
          message: "Stream removed successfully",
          streams: remainingStreams
        });
      } catch (error) {
        reply.code(404).send({
          status: "error",
          message: error.message
        });
      }
    });

    this.fastify.get("/monitor/:monitorId/status",
    {
      schema: {
        description: "Get the current status of a stream",
        params: { 
          monitorId: { type: 'string' }
        }
      }
    },    
    async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
        return;
      }

      const logs = await this.hlsMonitors.get(request.params.monitorId).getErrors();
      const lastCheckedMS = this.hlsMonitors.get(request.params.monitorId).getLastChecked();
      const monitorState = this.hlsMonitors.get(request.params.monitorId).getState();
      const lastChecked = new Date(lastCheckedMS).toLocaleString();
      reply.code(200).header("Content-Type", "application/json; charset=utf-8").send({ lastChecked: lastChecked, state: monitorState, logs: logs });
    });

    this.fastify.delete("/monitor/:monitorId/status",
    {
      schema: {
        description: "Delete the cached status of a stream",
        params: { 
          monitorId: { type: 'string' }
        }
      }
    },    
    async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      await this.hlsMonitors.get(request.params.monitorId).clearErrors();
      reply.code(200).header("Content-Type", "application/json; charset=utf-8").send({ message: "Cleared errors" });
    });

    this.fastify.post("/monitor/:monitorId/stop",
      {
        schema: {
          description: "Stop a specific monitor",
          params: { 
            monitorId: { type: 'string' }
          }
        }
      },    
      async (request, reply) => {
        if (!this.hlsMonitors.has(request.params.monitorId)) {
          reply.code(500).send({
            status: "error",
            message: "monitor not initialized",
          });
        }
        await this.hlsMonitors.get(request.params.monitorId).stop();
        reply.code(200).header("Content-Type", "application/json; charset=utf-8").send({ status: "Stopped monitoring" });
      });
  
      this.fastify.post("/monitor/:monitorId/start", 
      {
        schema: {
          description: "Start a specific monitor",
          params: { 
            monitorId: { type: 'string' }
          }
        }
      },    
      async (request, reply) => {
        if (!this.hlsMonitors.has(request.params.monitorId)) {
          reply.code(500).send({
            status: "error",
            message: "monitor not initialized",
          });
        }
        this.hlsMonitors.get(request.params.monitorId).start();
        reply.code(200).header("Content-Type", "application/json; charset=utf-8").send({ status: "Started monitoring" });
      });
  

    this.fastify.delete("/monitor",
    {
      schema: {
        description: "Stop and delete all monitors",
        response: {
          '200': {
            type: 'object',
            properties: {
              message: { type: 'string' },
              deletedCount: { type: 'number' },
              deletedMonitors: { 
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const monitorIds = Array.from(this.hlsMonitors.keys());
      
      // Stop and delete all monitors
      for (const monitorId of monitorIds) {
        const monitor = this.hlsMonitors.get(monitorId);
        monitor.setState(State.INACTIVE);
        this.hlsMonitors.delete(monitorId);
      }

      reply.code(200).send({
        message: "All monitors stopped and deleted successfully",
        deletedCount: monitorIds.length,
        deletedMonitors: monitorIds
      });
    });

    this.fastify.delete("/monitor/:monitorId",
    {
      schema: {
        description: "Stop and delete a specific monitor",
        params: { 
          monitorId: { type: 'string' }
        },
        response: {
          '200': {
            type: 'object',
            properties: {
              message: { type: 'string' },
              monitorId: { type: 'string' }
            }
          },
          '404': {
            type: 'object',
            properties: {
              status: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    }, 
    async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(404).send({
          status: "error",
          message: "Monitor not found"
        });
        return;
      }

      const monitor = this.hlsMonitors.get(request.params.monitorId);
      monitor.setState(State.INACTIVE); // Stop the monitor
      this.hlsMonitors.delete(request.params.monitorId); // Remove from map

      reply.code(200).send({
        message: "Monitor stopped and deleted successfully",
        monitorId: request.params.monitorId
      });
    });

    this.fastify.get("/metrics", async (request, reply) => {
      let output = [];
      
      // Monitor info metric
      output.push('# TYPE hls_monitor_info info');
      output.push('# HELP hls_monitor_info Information about the HLS monitor');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        output.push(`hls_monitor_info{monitor_id="${monitorId}",created="${monitor.getCreatedAt()}"} 1`);
      }

      // Monitor state metric (as a stateset)
      output.push('# TYPE hls_monitor_state stateset');
      output.push('# HELP hls_monitor_state Current state of the HLS monitor');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const state = monitor.getState();
        output.push(`hls_monitor_state{monitor_id="${monitorId}",state="active"} ${state === 'active' ? 1 : 0}`);
        output.push(`hls_monitor_state{monitor_id="${monitorId}",state="idle"} ${state === 'idle' ? 1 : 0}`);
        output.push(`hls_monitor_state{monitor_id="${monitorId}",state="inactive"} ${state === 'inactive' ? 1 : 0}`);
      }

      // Current error counts by type and media type
      output.push('# TYPE hls_monitor_current_errors gauge');
      output.push('# HELP hls_monitor_current_errors Current number of active errors broken down by type and media type');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const errors = await monitor.getErrors();
        // Count errors by type and media type
        const errorCounts = errors.reduce((acc, error) => {
          const key = `${error.errorType}__${error.mediaType}__${error.streamId}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        for (const [key, count] of Object.entries(errorCounts)) {
          const [errorType, mediaType, streamId] = key.split('__');
          output.push(
            `hls_monitor_current_errors{monitor_id="${monitorId}",error_type="${errorType}",media_type="${mediaType}",stream_id="${streamId}"} ${count}`
          );
        }
      }

      // Total error count (keep this as well for quick overview)
      output.push('# TYPE hls_monitor_total_errors gauge');
      output.push('# HELP hls_monitor_total_errors Total number of errors detected by the monitor');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const errorCount = (await monitor.getErrors()).length;
        output.push(`hls_monitor_total_errors{monitor_id="${monitorId}"} ${errorCount}`);
      }

      // Last check timestamp (as a gauge)
      output.push('# TYPE hls_monitor_last_check_timestamp_seconds gauge');
      output.push('# UNIT hls_monitor_last_check_timestamp_seconds seconds');
      output.push('# HELP hls_monitor_last_check_timestamp_seconds Unix timestamp of the last check');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const lastCheck = monitor.getLastChecked() / 1000; // Convert to seconds
        output.push(`hls_monitor_last_check_timestamp_seconds{monitor_id="${monitorId}"} ${lastCheck}`);
      }

      // Stream count (as a gauge)
      output.push('# TYPE hls_monitor_streams gauge');
      output.push('# HELP hls_monitor_streams Number of streams being monitored');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const streamCount = monitor.getStreams().length;
        output.push(`hls_monitor_streams{monitor_id="${monitorId}"} ${streamCount}`);
      }

      // Monitor uptime (as a gauge in seconds)
      output.push('# TYPE hls_monitor_uptime_seconds gauge');
      output.push('# HELP hls_monitor_uptime_seconds Time since monitor was created');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const uptime = (Date.now() - new Date(monitor.getCreatedAt()).getTime()) / 1000;
        output.push(`hls_monitor_uptime_seconds{monitor_id="${monitorId}"} ${uptime}`);
      }

      // Manifest fetch errors (as a gauge) - Combined version
      output.push('# TYPE hls_monitor_manifest_fetch_errors gauge');
      output.push('# HELP hls_monitor_manifest_fetch_errors Current manifest fetch errors with details');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const errors = await monitor.getErrors();
        const manifestErrors = errors.filter(e => e.errorType === ErrorType.MANIFEST_RETRIEVAL);
        
        // Group by URL, status code, and media type
        const errorsByUrl = manifestErrors.reduce((acc, error) => {
          const key = `${error.streamUrl}__${error.code || 0}__${error.mediaType}__${error.variant}__${error.streamId}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        for (const [key, count] of Object.entries(errorsByUrl)) {
          const [url, statusCode, mediaType, variant, streamId] = key.split('__');
          output.push(
            `hls_monitor_manifest_fetch_errors{monitor_id="${monitorId}",url="${url}",status_code="${statusCode}",media_type="${mediaType}",variant="${variant}",stream_id="${streamId}"} ${count}`
          );
        }
      }

      // Total errors per stream (as a counter)
      output.push('# TYPE hls_monitor_stream_total_errors counter');
      output.push('# HELP hls_monitor_stream_total_errors Total number of errors detected per stream since monitor creation');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const errorsPerStream = monitor.getTotalErrorsPerStream();
        for (const [streamId, count] of errorsPerStream.entries()) {
          output.push(`hls_monitor_stream_total_errors{monitor_id="${monitorId}",stream_id="${streamId}"} ${count}`);
        }
      }

      // Time since last error per stream (as a gauge in seconds)
      output.push('# TYPE hls_monitor_stream_time_since_last_error_seconds gauge');
      output.push('# HELP hls_monitor_stream_time_since_last_error_seconds Time since the last error was detected for each stream');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const lastErrorTimes = monitor.getLastErrorTimePerStream();
        for (const [streamId, lastErrorTime] of lastErrorTimes.entries()) {
          const timeSinceError = (Date.now() - lastErrorTime) / 1000;
          const lastErrorDate = new Date(lastErrorTime).toISOString();
          output.push(
            `hls_monitor_stream_time_since_last_error_seconds{monitor_id="${monitorId}",stream_id="${streamId}",last_error_time="${lastErrorDate}"} ${timeSinceError}`
          );
        }
      }

      // Total manifest errors (as a counter)
      output.push('# TYPE hls_monitor_manifest_errors counter');
      output.push('# HELP hls_monitor_manifest_errors Total number of manifest fetch errors (non-200 status codes)');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        output.push(
          `hls_monitor_manifest_errors{monitor_id="${monitorId}"} ${monitor.getManifestErrorCount()}`
        );
      }

      // Manifest errors by type (master vs variant)
      output.push('# TYPE hls_monitor_manifest_error_types gauge');
      output.push('# HELP hls_monitor_manifest_error_types Current manifest errors broken down by type');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const errors = await monitor.getErrors();
        if (errors.length > 100) {
          process.exit(1);
        }
        const manifestErrors = errors.filter(e => e.errorType === ErrorType.MANIFEST_RETRIEVAL);
        
        // Count by media type (MASTER vs VIDEO/AUDIO)
        const typeCount = manifestErrors.reduce((acc, err) => {
          acc[err.mediaType] = (acc[err.mediaType] || 0) + 1;
          return acc;
        }, {});

        for (const [mediaType, count] of Object.entries(typeCount)) {
          output.push(
            `hls_monitor_manifest_error_types{monitor_id="${monitorId}",media_type="${mediaType}"} ${count}`
          );
        }
      }

      // New errors counter (as a counter)
      output.push('# TYPE hls_monitor_new_errors_total counter');
      output.push('# HELP hls_monitor_new_errors_total Count of new errors detected since last check');
      
      for (const [monitorId, monitor] of this.hlsMonitors.entries()) {
        const errors = await monitor.getErrors();
        // Only count errors that occurred in the last check interval
        const newErrors = errors.filter(error => {
          const errorTime = new Date(error.date).getTime();
          return (Date.now() - errorTime) <= monitor.getUpdateInterval() + 500;
        });
        // Group by error type and media type
        const errorCounts = newErrors.reduce((acc, error) => {
          const key = `${error.errorType}__${error.mediaType}__${error.streamId}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
console.log(errorCounts, 222);
        for (const [key, count] of Object.entries(errorCounts)) {
          const [errorType, mediaType, streamId] = key.split('__');
          output.push(
            `hls_monitor_new_errors_total{monitor_id="${monitorId}",error_type="${errorType}",media_type="${mediaType}",stream_id="${streamId}"} ${count}`
          );
        }
      }

      output.push('# EOF');

      reply
        .code(200)
        .header('Content-Type', 'application/openmetrics-text; version=1.0.0; charset=utf-8')
        .send(output.join('\n'));
    });
  }

  /**
    * Start the server
    * @param {number} port - The port
    * @param {string} host - The host (ip) address (Optional)
    */
   async listen(port: number, host?: string) {
    await this.routes();
    this.fastify.listen(port, host, (err, address) => {
      if (err) {
        console.error(err);
        throw err;
      }
      console.log(`Server is now listening on ${address}`);
    });
  }
}
