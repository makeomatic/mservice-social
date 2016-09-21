const { ActionTransport } = require('mservice');
const auth = require('./../auth/token');
const path = require('path');

const { http, amqp } = ActionTransport;

module.exports = {
  router: {
    routes: {
      directory: path.resolve(__dirname, './../actions'),
      prefix: 'social',
      transports: [http, amqp],
    },
    auth: {
      strategies: {
        token: auth,
      },
    },
  },
};
