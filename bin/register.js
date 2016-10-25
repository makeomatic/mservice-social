#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const config = require('ms-conf').get('/');
const AMQPTransport = require('ms-amqp-transport');
const yargs = require('yargs');

const argv = yargs
  .coerce({
    account: JSON.parse,
  })
  .required('internal', 'supply owner username')
  .required('network', 'supply network, <twitter>')
  .argv;

if (!argv.account) throw new Error('must supply twitter account');

const route = `${config.router.prefix}.feed.register`;

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
