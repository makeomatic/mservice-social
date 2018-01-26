const { ActionTransport, routerExtension } = require('@microfleet/core');
const path = require('path');

const auditLog = routerExtension('audit/log');
const { http, amqp } = ActionTransport;

module.exports = {
  router: {
    routes: {
      directory: path.resolve(__dirname, './../actions'),
      prefix: 'social',
      transports: [http, amqp],
    },
    extensions: {
      enabled: ['postRequest', 'preRequest', 'preResponse'],
      register: [auditLog],
    },
  },
};
