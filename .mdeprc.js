module.exports = {
  "node": "16",
  "auto_compose": true,
  "with_local_compose": true,
  "nycCoverage": false,
  "nycReport": false,
  "services": [
    "redisCluster",
    "rabbitmq",
    "postgres"
  ],
}
