require('dotenv').config()

module.exports = {
  "node": "20.10",
  "auto_compose": true,
  "with_local_compose": true,
  "nycCoverage": false,
  "nycReport": false,
  "test_framework": 'c8 /src/node_modules/.bin/mocha',
  "services": [
    "redisCluster",
    "rabbitmq",
    "postgres"
  ],
  "extras": {
    "tester": {
      "volumes": [
        "${PWD}:/src:cached"
      ],
      "environment": {
        "NCONF_FILE_PATH": JSON.stringify(['/src/test/configs/config.js']),
      }
    }
  },
  pre: 'rimraf ./coverage/tmp',
  post_exec: 'pnpm exec -- c8 report -r text -r lcov',
}
