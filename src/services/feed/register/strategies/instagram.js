const Promise = require('bluebird');

function afterSave(feed) {
  return Promise.resolve(feed);
}

function collectFeedParams(account) {
  return {
    networkId: account.id,
    meta: account,
  };
}

function getLastId(feed) {
  const instagram = this.service('instagram');

  return instagram
    .media()
    .getLastId(feed.network_id)
    .then((id) => [feed, id]);
}

function syncHistory([feed, lastId]) {
  const { meta: { token } } = feed;
  const instagram = this.service('instagram');

  return instagram
    .media()
    .syncAccountHistory(token, lastId)
    .return(feed);
}

module.exports = {
  afterSave,
  collectFeedParams,
  getLastId,
  syncHistory,
};
