require('bluebird').config({
  cancellation: true,
});
const Service = require('./social');

module.exports = Service;
