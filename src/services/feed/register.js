const Promise = require('bluebird');
const getRegisterStrategy = require('./register/strategies');

async function saveFeed(internal, network, params) {
  const { logger } = this;
  const feed = {
    internal,
    network,
    network_id: params.networkId,
    meta: JSON.stringify(params.meta),
  };

  const response = await this
    .service('storage')
    .feeds()
    .save(feed);

  const { id } = response;
  logger.info({ id, network }, `Save ${network} feed #${id}`);

  return response;
}

function register(data) {
  // @TODO move to strategy
  if (data.network === 'twitter') {
    const strategy = getRegisterStrategy('twitter');

    return Promise.bind(this, data).then(strategy);
  }

  const { network, accounts, internal } = data;
  const {
    afterSave, collectFeedParams, getLastId, syncHistory,
  } = getRegisterStrategy(network);

  return Promise
    .bind(this, accounts)
    .map(collectFeedParams)
    .map((params) => saveFeed.call(this, internal, network, params))
    .map(afterSave)
    .map(getLastId)
    .map(syncHistory);
}

module.exports = register;
