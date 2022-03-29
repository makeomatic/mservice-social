#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const conf = require('ms-conf').get('/');
const { connect } = require('@microfleet/transport-amqp');
const yargs = require('yargs');
const debug = require('debug')('mservice:social:register');

const Social = require('../src');

// merged configuration
const service = new Social(conf);
const { config } = service;
const { argv } = yargs
  .coerce({
    account: JSON.parse,
  })
  .demandOption('internal', 'supply owner username')
  .demandOption('network', 'supply network, <twitter>')
  .demandOption('account', 'supply account, stringified JSON');

if (!argv.account) throw new Error('must supply twitter account');

const route = `${config.router.routes.prefix}.feed.register`;
const message = {
  internal: argv.internal,
  network: argv.network,
  accounts: [argv.account],
};

debug('sending to %s, message %j', route, message);
debug('amqp configuration: %j', config.amqp.transport);

(async () => {
  const amqp = await connect(Object.assign(config.amqp.transport, { debug: true }));
  try {
    await amqp.publish(route, message);
  } finally {
    await amqp?.close();
  }
})();
