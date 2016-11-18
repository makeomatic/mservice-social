const assert = require('assert');
const is = require('is');

function getMediaUrl(mediaId, accessToken) {
  assert.equal(is.string(mediaId), true);
  assert.equal(is.string(accessToken), true);
  assert.equal(is.empty(mediaId), false);
  assert.equal(is.empty(accessToken), false);

  return `https://api.instagram.com/v1/media/${mediaId}?access_token=${accessToken}`;
}

module.exports = getMediaUrl;
