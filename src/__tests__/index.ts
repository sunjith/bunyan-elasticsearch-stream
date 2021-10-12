import bunyan from "bunyan";
import BunyanESStream from "../";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("stream", () => {
  it("should receive log events", async () => {
    const logReceived = jest.fn();
    const logSubmitted = jest.fn();

    const esStream = new BunyanESStream({
      indexName: "test-log",
      limit: 3,
      clientOptions: { node: "http://localhost:9200" },
    });
    esStream.on("log_received", logReceived);
    esStream.on("log_submitted", logSubmitted);

    const logger = bunyan.createLogger({
      name: "test",
      streams: [{ level: "debug", stream: esStream }],
    });

    logger.debug("test1");
    expect(logReceived).toHaveBeenCalledTimes(1);
    logger.debug("test2");
    expect(logReceived).toHaveBeenCalledTimes(2);
    logger.debug("test3");
    expect(logReceived).toHaveBeenCalledTimes(3);
    expect(logSubmitted).toHaveBeenNthCalledWith(1, "limit_exceeded");
    esStream.end();
    // wait for elasticsearch bulk write to complete
    await delay(3000);
  });
});
