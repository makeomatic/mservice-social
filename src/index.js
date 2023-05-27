require('bluebird').config({
  cancellation: true,
});
const Service = require('./social');

exports = module.exports = Service;
exports.default = Service;
