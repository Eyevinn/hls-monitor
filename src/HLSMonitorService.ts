import Fastify from "fastify";
import { HLSMonitor } from "./HLSMonitor";
import shortUUID from "short-uuid";

export class HLSMonitorService {
  private fastify: any;
  private hlsMonitors = new Map<string, HLSMonitor>();

  constructor() {
    this.fastify = Fastify({ logger: true });
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
        host: "localhost",
        schemes: ["http"],
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

    this.fastify.get("/monitor/:monitorId/status", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
    
      const logs = await this.hlsMonitors.get(request.params.monitorId).getErrors()
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ logs: logs });
    });

    this.fastify.get("/monitor/:monitorId/clear-errors", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      await this.hlsMonitors.get(request.params.monitorId).clearErrors();
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ message: "Cleared errors" });
    });

    this,this.fastify.post("/monitor", async (request, reply) => {
      let uuid = shortUUID.generate();
      while(this.hlsMonitors.has(uuid)) {
        uuid = shortUUID.generate();
      }
      const body = request.body;
      let monitor;
      if(body["stale_limit"]) {
        monitor = new HLSMonitor(body["streams"], body["stale_limit"]);
      } else {
        monitor = new HLSMonitor(body["streams"]);
      }
      monitor.create();
      this.hlsMonitors.set(uuid,monitor)
      console.log(this.monitors)
      const rep = {
        status: "Created a new hls-monitor",
        streams: body["streams"]
      }
      if(body["stale_limit"]) {
        rep["stale_limit"] = body["stale_limit"];
      }
      rep["monitorId"] = uuid;
      reply
        .code(201)
        .header("Content-Type", "application/json; charset=utf-8")
        .send(rep);
    });

    this,this.fastify.get("/monitor", async (request, reply) => {
      if (!this.hlsMonitors) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });

      }
      reply
      .code(200)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(Object.fromEntries(this.monitors)));
    });

    this,this.fastify.get("/monitor/:monitorId/streams", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      reply.send({ streams: this.hlsMonitors.get(request.parms.monitorId).getStreamUrls() });
    });

    this,this.fastify.put("/monitor/:monitorId", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      const resp = await this.hlsMonitors.get(request.params.monitorId).update(request.body["streams"]);
      reply
        .code(201)
        .header("Content-Type", "application/json; charset=utf-8")
        .send({ 
          message: "Updated hls-monitors streams",
          streams: resp 
        });
    });

    this,this.fastify.delete("/monitor/:monitorId", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      this.hlsMonitors.delete[request.params.monitorId]
      reply.send({ status: "monitor deleted" });

    });

    this.fastify.get("/healthcheck", async (request, reply) => {
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ status: "Healthy 💖" });
    });

    this.fastify.post("/monitor/:monitorId/stop", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      await this.hlsMonitors.get(request.params.monitorId).stop();
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ status: "Stopped monitoring" });
    });

    this.fastify.post("/monitor/:monitorId/start", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      this.hlsMonitors.get(request.params.monitorId).start();
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ status: "Started monitoring" });
    });

    this.fastify.put("/monitor/:monitorId/delete", async (request, reply) => {
      if (!this.hlsMonitors.has(request.params.monitorId)) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      const stream = request.body;
      const resp = await this.hlsMonitors.get(request.params.monitorId).remove(stream);
      reply
        .code(201)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ 
          message: "Deleted stream", 
          streams: resp
        });
    });
  }

  async listen(port: number) {
    await this.routes();
    this.fastify.listen(port, (err, address) => {
      if (err) {
        console.error(err);
        throw err;
      }
      console.log(`Server is now listening on ${address}`);
    });
  }
}
