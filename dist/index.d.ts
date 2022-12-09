/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Writable } from "stream";
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
    constructor(options: BunyanESStreamOptions);
    _write(chunk: any, _encoding: BufferEncoding, callback: (err?: Error) => void): void;
    push(chunk: any): void;
    resetTimer(): void;
    flush(): void;
    bulk(buffer: any[]): void;
    _final(callback: () => void): void;
}
