import Fastify from "fastify";
import HLSMonitor from "./index";

const fastify = Fastify({ logger: true });
let monitor: HLSMonitor;

fastify.get("/status", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  reply.send({ logs: monitor.getFails() });
});

fastify.get("/clearerrors", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  await monitor.clearFails();
  reply.send({ logs: "OK" });
});

fastify.get("/healthcheck", async (request, reply) => {
  reply.send({ status: "Healthy 💖" });
});

fastify.get("/stop", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  monitor.stop();
  reply.send({ status: "Stopped monitoring" });
});

fastify.get("/start", async (request, reply) => {
  if (!monitor) {
    reply.code(500).send({
      status: "error",
      message: "monitor not initialized",
    });
  }
  monitor.stop();
  reply.send({ status: "Started monitoring" });
});

fastify.post("/init", async (request, reply) => {
  const body = request.body;
  if (!body["streams"]) {
    reply.send({ error: "Missing streams in body" });
  }
  monitor = new HLSMonitor(body["streams"]);
  monitor.init();
  reply.send({ status: "Ok" });
});

fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.error(`Server is now listening on ${address}`);
});
