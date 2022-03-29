const assert = require('assert');
const Service = require('../src');

const service = new Service();
const { knex } = service;
const name = process.argv[2];

assert(name, 'Migration name must be specified');

knex.migrate
  .make(name)
  .then((info) => {
    service.log.info({ info }, 'Create migration');
    return process.exit();
  })
  .catch((err) => {
    service.log.info({ err }, 'migration failed');
    process.exit(128);
  });
