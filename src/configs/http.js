/**
 * @typedef { import('@microfleet/plugin-router-hapi').RouterHapiPluginConfig } RouterHapiPluginConfig
 * @typedef { import('@microfleet/plugin-hapi').HapiPluginConfig } HapiPluginConfig
 */

/**
 * @type {HapiPluginConfig}
 */
exports.hapi = {
  server: {
    port: 3000,
  },
};

/**
 * @type {RouterHapiPluginConfig}
 */
exports.routerHapi = {
  prefix: 'api',
};
