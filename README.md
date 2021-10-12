# bunyan-elasticsearch-stream

- A [Bunyan](https://github.com/trentm/node-bunyan) stream for saving logs into Elasticsearch.
- Buffers logs in memory instead of sending them to the Elasticsearch server one by one.
- The logs are accumulated in memory until a certain number of logs reached or a certain amount of time passed without sending any logs.
- The goal is to save resources on both your application and Elastic Search server (ex: lowering costs in AWS).
- Written in Typescript.

Based on [bunyan-elasticsearch-bulk](https://github.com/Milad/bunyan-elasticsearch-bulk)

## Requirements

- Elasticsearch 7.x
- [Elasticsearch Data Stream](https://www.elastic.co/guide/en/elasticsearch/reference/master/data-streams.html).

## Installation

`npm i bunyan-elasticsearch-stream`

## Usage with Node

```typescript
import bunyan from "bunyan";
import BunyanESStream from "bunyan-elasticsearch-stream";

const config = {
  name: 'Application Name',
  streams: [{
    level: 'debug',
    stream: new BunyanESStream({
      clientOptions: { node: "http://localhost:9200" },
    })
  }]
}

const log = bunyan.createLogger(config)

// From here, you can log things according to the best practices of Bunyan.
// Please familiarize yourself with it here: https://github.com/trentm/node-bunyan

log.info('Log this message!')
log.info({ otherInfo: 'What else do you need to log here?' }, 'Log this message!')
```

## List of Configuration Parameters

| Field         | Default                         | Description                                                                                                             |
| ------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| indexName     | `app-log`                       | Index name for the Elasticsearch data stream                                                                            |
| limit         | `100`                           | How many logs to collect before submitting them to ES                                                                   |
| interval      | `5000`                          | Time in milliseconds before submitting logs even if their count has not reached the `limit`                             |
| clientOptions | `{}`                            | Elasticsearch client options                                                                                            |
| client        | `Client(options.clientOptions)` | If you don't want to use the included version of the client `v7.x`, you can configure the one you want and pass it here |

## Emitted Events

Check [server.ts](./server.ts) for example usages:

| Event           | Fires when ..                                                                            |
| --------------- | ---------------------------------------------------------------------------------------- |
| `log_received`  | we receive a log                                                                         |
| `log_submitted` | we bulk-submit logs to ES server. With a reason `limit_exceeded` or `timeout`            |
| `error`         | an error happens in the whole bulk submission or when saving an individual message fails |

## License

MIT
