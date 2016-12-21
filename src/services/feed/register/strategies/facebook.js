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
    .getLast(feed.network_id)
    .then(media => [feed, media]);
}

function syncHistory([feed, lastMedia]) {
  const { network_id: networkId, meta: { token } } = feed;

  return this
    .service('facebook')
    .media
    .syncPageHistory(networkId, token, lastMedia)
    .return(feed);
}

module.exports = {
  afterSave,
  collectFeedParams,
  getLastId,
  syncHistory,
};
