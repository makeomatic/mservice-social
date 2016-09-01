const { ActionTransport } = require('mservice');
const auth = require('./../auth/token');
const path = require('path');

const { http, socketIO } = ActionTransport;

module.exports = {
  router: {
    routes: {
      directory: path.resolve(__dirname, './../actions'),
      prefix: 'social',
      transports: [http, socketIO],
    },
    auth: {
      strategies: {
        token: auth,
      },
    },
  },
};
