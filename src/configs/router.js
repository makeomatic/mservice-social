const { ActionTransport } = require('mservice');
const auth = require('./../auth/token');
const path = require('path');

const { http } = ActionTransport;

module.exports = {
  router: {
    routes: {
      directory: path.resolve(__dirname, './../actions'),
      prefix: 'social',
      transports: [http],
    },
    auth: {
      strategies: {
        token: auth,
      },
    },
  },
};
