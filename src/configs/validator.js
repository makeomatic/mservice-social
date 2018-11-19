const path = require('path');

module.exports = {
  validator: {
    schemas: [
      path.resolve(__dirname, '../../schemas'),
    ],
    ajv: {
      coerceTypes: true,
    },
  },
};
