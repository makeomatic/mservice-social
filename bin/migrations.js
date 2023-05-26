const assert = require('assert');
const prepareService = require('../src');

const name = process.argv[2];

assert(name, 'Migration name must be specified');

(async () => {
  const service = await prepareService();
  const { knex } = service;

  knex.migrate
    .make(name)
    .then((info) => {
      service.log.info({ info }, 'Created migration');
      return process.exit();
    })
    .catch((err) => {
      service.log.fatal({ err }, 'failed to run migration');
    });
})();
