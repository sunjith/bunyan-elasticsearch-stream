import { Writable } from "stream";
import bunyan from "bunyan";
import { Client, ClientOptions } from "@elastic/elasticsearch";

export interface BunyanESStreamOptions {
  indexName?: string;
  limit?: number;
  interval?: number;
  clientOptions?: ClientOptions;
  client?: Client;
}

export default class BunyanESStream extends Writable {
  closed: boolean;
  intervalId?: NodeJS.Timeout;
  buffer: any[];
  indexName: string;
  limit: number;
  interval: number;
  client: Client;
  clientOptions: ClientOptions;

  constructor(options: BunyanESStreamOptions) {
    super({
      emitClose: true,
      ...options,
    });

    this.closed = false;
    // We are going to collect logs in this property
    this.buffer = [];

    // Prepare some configurations
    this.indexName = options.indexName || "app-log";
    this.limit = options.limit || 100;
    this.interval = options.interval || 5000;
    this.clientOptions = options.clientOptions || {};
    this.client = options.client || new Client(this.clientOptions);

    this.client.info({}, (err) => {
      if (err) {
        this.emit("error", err);
      }
    });
  }

  _write(
    chunk: any,
    _encoding: BufferEncoding,
    callback: (err?: Error) => void
  ) {
    try {
      const body = JSON.parse(chunk.toString());

      body.level = bunyan.nameFromLevel[body.level];
      body["@timestamp"] = body.time;
      body.message = body.msg;
      delete body.time;
      delete body.msg;

      const entry = {
        index: this.indexName,
        body,
      };

      this.push(entry);

      if (callback) {
        callback();
      }
    } catch (e) {
      if (callback) {
        callback(e);
      }
    }
  }

  push(chunk: any) {
    this.emit("log_received");

    const length = this.buffer.push(chunk);

    if (length >= this.limit) {
      this.emit("log_submitted", "limit_exceeded");

      this.flush();
    } else if (!this.intervalId) {
      this.resetTimer();
    }
  }

  resetTimer() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }

    this.intervalId = setTimeout(() => {
      this.emit("log_submitted", "timeout");

      this.flush();
    }, this.interval);

    if (this.closed && typeof this.intervalId.unref === "function") {
      this.intervalId.unref();
    }
  }

  flush() {
    this.resetTimer();

    if (this.buffer.length === 0) {
      return;
    }

    const oldBuffer = this.buffer;

    this.buffer = [];

    this.bulk(oldBuffer);
  }

  bulk(buffer: any[]) {
    const body = buffer.reduce((sum, value) => {
      const index = {
        create: {
          _index: value.index,
        },
      };

      sum.push(JSON.stringify(index));
      sum.push(JSON.stringify(value.body));

      return sum;
    }, []);

    this.client.bulk({ body }, (err, resp) => {
      if (resp && resp.body && resp.body.errors) {
        for (const item of resp.body.items) {
          if (item && item.create && item.create.error) {
            this.emit("error", item.create.error);
          }
        }
      } else if (err) {
        this.emit("error", err);
      }
    });
  }

  _final(callback: () => void) {
    this.closed = true;
    this.flush();
    if (callback) {
      callback();
    }
  }
}
