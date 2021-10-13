module.exports = () => ({
  esVersion: "7.15.0", // ! must be exact version. Ref: https://github.com/elastic/elasticsearch-js .
  // don't be shy to fork our code and update deps to correct.
  clusterName: "test-cluster",
  nodeName: "test-node",
  port: 9200,
  indexes: [
    {
      name: "test-log",
      body: {
        settings: {
          number_of_shards: "1",
          number_of_replicas: "1",
        },
        aliases: {},
        mappings: {
          dynamic: false,
          properties: {
            // mapping
            hostname: {
              type: "keyword",
              index: false,
            },
            level: {
              type: "keyword",
            },
            msg: {
              type: "text",
              index_options: "docs",
            },
            name: {
              type: "keyword",
              index: false,
            },
            pid: {
              type: "integer",
              index: false,
              ignore_malformed: false,
              coerce: true,
            },
            time: {
              type: "date",
            },
          },
        },
      },
    },
  ],
});
