const assert = require('assert');
const is = require('is');

function mangleToken(token) {
  assert.equal(is.string(token), true);

  return token.replace(/^(.{6}).*(.{6})$/, '$1***$2');
}

module.exports = {
  mangleToken,
};
