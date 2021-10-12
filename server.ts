import bunyan from "bunyan";
import BunyanESStream from "./src";

const esStream = new BunyanESStream({
  limit: 10,
  clientOptions: { node: "http://localhost:9200" },
});

// The following console logs are meant for development and debugging.
// tslint:disable-next-line:no-console
esStream.on("error", console.warn);

esStream.on("log_submitted", (why) => {
  // tslint:disable-next-line:no-console
  console.log("log_submitted", why);
});

esStream.on("log_received", () => {
  // tslint:disable-next-line:no-console
  console.log("log_received");
});

const log = bunyan.createLogger({
  name: "My Test App",
  streams: [
    {
      level: "debug",
      stream: esStream,
    },
  ],
  serializers: bunyan.stdSerializers,
});

setInterval(() => {
  log.info({ test: true }, "test");
}, 100);
