import Fastify from "fastify";
import HLSMonitor from "./index";

const fastify = Fastify({ logger: true });
let monitor: HLSMonitor;

fastify.register(require("fastify-swagger"), {
  routePrefix: "/documentation",
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

fastify.get("/status", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  const logs = await monitor.getFails()
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ logs: logs });
});

fastify.get("/clearerrors", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  await monitor.clearFails();
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ logs: "Ok" });
});

fastify.get("/streams", async (request, reply) => {
  reply.send({ streams: monitor.getStreamUrls() });
});

fastify.get("/healthcheck", async (request, reply) => {
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ status: "Healthy 💖" });
});

fastify.get("/stop", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  await monitor.stop();
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ status: "Stopped monitoring" });
});

fastify.get("/start", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  monitor.start();
  reply
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ status: "Started monitoring" });
});

fastify.put("/delete", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  const stream = request.body;
  const resp = await monitor.remove(stream);
  reply
    .code(201)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ 
      message: "Deleted stream", 
      streams: resp
    });
});


fastify.put("/create", async (request, reply) => {
  const body = request.body;
  if (!body["streams"]) {
    reply.send({ error: "Missing streams in body" });
  }
  if (monitor) {
    const resp = await monitor.update(body["streams"]);
    reply
      .code(201)
      .header("Content-Type", "application/json; charset=utf-8")
      .send({ 
        message: "Updated streams to monitor",
        streams: resp 
      });
  } else {
    monitor = new HLSMonitor(body["streams"]);
    monitor.init();
    reply
      .code(201)
      .header("Content-Type", "application/json; charset=utf-8")
      .send({ 
        status: "Created new a hls-monitor",
        streams: body["streams"] 
      });
  };
});

fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server is now listening on ${address}`);
});
