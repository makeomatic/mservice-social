#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const Social = require('../src');
const service = new Social(require('ms-conf').get('/'));
const AMQPTransport = require('ms-amqp-transport');
const yargs = require('yargs');

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

AMQPTransport
  .connect(config.amqp.transport.connection)
  .then(amqp => (
    amqp.publish(route, {
      internal: argv.internal,
      network: argv.network,
      filter: {
        accounts: [{
          id: argv.account.id,
          username: argv.account.username,
        }],
      },
    })
    .finally(() => amqp.close())
  ));
