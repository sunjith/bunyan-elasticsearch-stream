"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const bunyan_1 = __importDefault(require("bunyan"));
const elasticsearch_1 = require("@elastic/elasticsearch");
class BunyanESStream extends stream_1.Writable {
    constructor(options) {
        super(Object.assign({ emitClose: true }, options));
        this.closed = false;
        // We are going to collect logs in this property
        this.buffer = [];
        // Prepare some configurations
        this.indexName = options.indexName || "app-log";
        this.limit = options.limit || 100;
        this.interval = options.interval || 5000;
        this.clientOptions = options.clientOptions || {};
        this.client = options.client || new elasticsearch_1.Client(this.clientOptions);
        this.client.info({}, (err) => {
            if (err) {
                this.emit("error", err);
            }
        });
    }
    _write(chunk, _encoding, callback) {
        try {
            const body = JSON.parse(chunk.toString());
            body.level = bunyan_1.default.nameFromLevel[body.level];
            body["@timestamp"] = body.time;
            delete body.time;
            const entry = {
                index: this.indexName,
                body,
            };
            this.push(entry);
            if (callback) {
                callback();
            }
        }
        catch (e) {
            if (callback) {
                callback(e);
            }
        }
    }
    push(chunk) {
        this.emit("log_received");
        const length = this.buffer.push(chunk);
        if (length >= this.limit) {
            this.emit("log_submitted", "limit_exceeded");
            this.flush();
        }
        else if (!this.intervalId) {
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
    bulk(buffer) {
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
            }
            else if (err) {
                this.emit("error", err);
            }
        });
    }
    _final(callback) {
        this.closed = true;
        this.flush();
        if (callback) {
            callback();
        }
    }
}
exports.default = BunyanESStream;
