const assert = require('assert');
const is = require('is');

function getMediaUrl(token) {
  assert.strictEqual(is.string(token), true);
  assert.strictEqual(is.empty(token), false);

  return `https://api.instagram.com/v1/users/self/media/recent?access_token=${token}&count=200`;
}

module.exports = getMediaUrl;
