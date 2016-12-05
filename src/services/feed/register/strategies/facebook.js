function afterSave(feed) {
  const { network_id: pageId, meta: { token } } = feed;

  return this
    .service('facebook')
    .subscription
    .subscribeApp(pageId, token)
    .return(feed);
}

function collectFeedParams(account) {
  return {
    networkId: account.id,
    meta: account,
  };
}

function getLastId(feed) {
  return this
    .service('facebook')
    .media
    .getLastId(feed.network_id)
    .then(id => [feed, id]);
}

function syncHistory([feed, lastId]) {
  const { network_id: networkId, meta: { token } } = feed;

  return this
    .service('facebook')
    .media
    .syncPageHistory(networkId, token, lastId)
    .return(feed);
}

module.exports = {
  afterSave,
  collectFeedParams,
  getLastId,
  syncHistory,
};
