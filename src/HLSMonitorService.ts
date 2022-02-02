import Fastify from "fastify";
import { HLSMonitor } from "./HLSMonitor";

export class HLSMonitorService {
  private fastify: any;
  private hlsMonitor: HLSMonitor;

  constructor() {
    this.fastify = Fastify({ logger: true });
  }

  get monitor() {
    if (!this.hlsMonitor) {
      this.hlsMonitor = new HLSMonitor([]);
    }
    return this.hlsMonitor;
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

    this.fastify.get("/status", async (request, reply) => {
      if (!this.hlsMonitor) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      const logs = await this.hlsMonitor.getErrors()
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ logs: logs });
    });

    this.fastify.get("/clear-errors", async (request, reply) => {
      if (!this.hlsMonitor) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      await this.hlsMonitor.clearErrors();
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ logs: "Ok" });
    });

    this.fastify.get("/streams", async (request, reply) => {
      if (!this.hlsMonitor) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      reply.send({ streams: this.hlsMonitor.getStreamUrls() });
    });

    this.fastify.get("/healthcheck", async (request, reply) => {
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ status: "Healthy 💖" });
    });

    this.fastify.get("/stop", async (request, reply) => {
      if (!this.hlsMonitor) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      await this.hlsMonitor.stop();
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ status: "Stopped monitoring" });
    });

    this.fastify.get("/start", async (request, reply) => {
      if (!this.hlsMonitor) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      this.hlsMonitor.start();
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ status: "Started monitoring" });
    });

    this.fastify.put("/delete", async (request, reply) => {
      if (!this.hlsMonitor) {
        reply.code(500).send({
          status: "error",
          message: "monitor not initialized",
        });
      }
      const stream = request.body;
      const resp = await this.hlsMonitor.remove(stream);
      reply
        .code(201)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({ 
          message: "Deleted stream", 
          streams: resp
        });
    });

    this.fastify.put("/create", async (request, reply) => {
      const body = request.body;
      if (!body["streams"]) {
        reply.send({ error: "Missing streams in body" });
      }
      if (this.hlsMonitor) {
        const resp = await this.hlsMonitor.update(body["streams"]);
        reply
          .code(201)
          .header("Content-Type", "application/json; charset=utf-8")
          .send({ 
            message: "Updated streams to this.hlsMonitor",
            streams: resp 
          });
      } else {
        this.hlsMonitor = new HLSMonitor(body["streams"]);
        this.hlsMonitor.create();
        reply
          .code(201)
          .header("Content-Type", "application/json; charset=utf-8")
          .send({ 
            status: "Created a new hls-monitor",
            streams: body["streams"] 
          });
      };
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
