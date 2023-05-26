const { Extensions } = require('@microfleet/plugin-router');
const path = require('path');

module.exports = {
  /**
   * @type { import('@microfleet/plugin-router').RouterPluginConfig }
   */
  router: {
    routes: {
      directory: path.resolve(__dirname, '../actions'),
      prefix: 'social',
      enabledGenericActions: ['health'],
    },
    extensions: {
      register: [Extensions.auditLog()],
    },
  },
};
