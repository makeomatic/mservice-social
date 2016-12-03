const Crypto = require('crypto');

function generator(secret, accessToken) {
  return Crypto
    .createHmac('sha256', secret)
    .update(accessToken)
    .digest('hex');
}

module.exports = generator;
