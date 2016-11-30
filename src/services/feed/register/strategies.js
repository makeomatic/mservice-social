const { NotImplementedError } = require('common-errors');
const facebookStrategy = require('./strategies/facebook');
const instagramStrategy = require('./strategies/instagram');
const twitterStrategy = require('./strategies/twitter');

const strategies = new Map();

strategies.set('facebook', facebookStrategy);
strategies.set('instagram', instagramStrategy);
strategies.set('twitter', twitterStrategy);

function getRegisterStrategy(network) {
  if (strategies.has(network) === false) {
    throw new NotImplementedError(`Register strategy for ${network}`);
  }

  return strategies.get(network);
}

module.exports = getRegisterStrategy;
