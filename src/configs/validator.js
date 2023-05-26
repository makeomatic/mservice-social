/**
 * @typedef { import('@microfleet/plugin-validator').ValidatorConfig } ValidatorConfig
 */

const path = require('path');

module.exports = {
  /**
   * @type {ValidatorConfig}
   */
  validator: {
    schemas: [
      path.resolve(__dirname, '../../schemas'),
    ],
    ajv: {
      coerceTypes: true,
    },
  },
};
