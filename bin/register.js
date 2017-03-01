#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const Social = require('../src');
const service = new Social(require('ms-conf').get('/'));
const AMQPTransport = require('ms-amqp-transport');
const yargs = require('yargs');
const debug = require('debug')('mservice:social:register');

// merged configuration
const config = service.config;

const argv = yargs
  .coerce({
    account: JSON.parse,
  })
  .required('internal', 'supply owner username')
  .required('network', 'supply network, <twitter>')
  .required('account', 'supply account, stringified JSON')
  .argv;

if (!argv.account) throw new Error('must supply twitter account');

const route = `${config.router.routes.prefix}.feed.register`;
const message = {
  internal: argv.internal,
  network: argv.network,
  filter: {
    accounts: [{
      id: argv.account.id,
      username: argv.account.username,
    }],
  },
};

debug('sending to %s, message %j', route, message);

return AMQPTransport
  .connect(config.amqp.transport)
  .then(amqp => (
    amqp.publish(route, message).finally(() => amqp.close())
  ));
