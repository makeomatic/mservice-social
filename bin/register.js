#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const AMQPTransport = require('@microfleet/transport-amqp');
const yargs = require('yargs');
const debug = require('debug')('mservice:social:register');

const prepareSocial = require('../src');

const { argv } = yargs
  .coerce({
    account: JSON.parse,
  })
  .demandOption('internal', 'supply owner username')
  .demandOption('network', 'supply network, <twitter>')
  .demandOption('account', 'supply account, stringified JSON');

if (!argv.account) throw new Error('must supply twitter account');

// merged configuration
(async () => {
  const service = await prepareSocial();
  const { config } = service;

  const route = `${config.router.routes.prefix}.feed.register`;
  const message = {
    internal: argv.internal,
    network: argv.network,
    accounts: [argv.account],
  };

  debug('sending to %s, message %j', route, message);
  debug('amqp configuration: %j', config.amqp.transport);

  let amqp;
  try {
    amqp = await AMQPTransport.connect(Object.assign(config.amqp.transport, { debug: true }));
    await amqp.publish(route, message);
  } finally {
    await amqp?.close();
  }
})();
