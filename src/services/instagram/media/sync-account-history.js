/* eslint-disable no-use-before-define */

const BigNumber = require('bn.js');
const Promise = require('bluebird');

function filterLessThanId(data, lastId) {
  const [lastMediaIdString] = lastId.split('_');
  const lastMediaId = new BigNumber(lastMediaIdString, 10);

  return data.filter((media) => {
    const [mediaIdString] = media.id.split('_');
    const mediaId = new BigNumber(mediaIdString, 10);

    return lastMediaId.lt(mediaId);
  });
}

function fetchComments(media, accessToken) {
  return this.comments
    .fetch(media.id, accessToken)
    .then(comments => ({ media, comments }));
}

// first arg is pagination data
function setPagination(response) {
  this[0] = response.pagination;
}

// returns context
function returnContext() {
  return this;
}

function syncAccountHistory(url, accessToken, lastId) {
  const options = { url, json: true };
  const ctx = [null, accessToken, lastId];

  return Promise
    .bind(this, [options, accessToken])
    .spread(this.instagram.request)
    .bind(ctx)
    .tap(setPagination)
    .get('data')
    .then(data => (lastId ? filterLessThanId(data, lastId) : data))
    .map(media => fetchComments.call(this, media, accessToken))
    .map(media => this.save(media))
    .then(returnContext)
    .bind(this)
    .spread(paginate);
}

function paginate(pagination, accessToken, lastId) {
  if (pagination.next_url === undefined) {
    return null;
  }

  if (lastId) {
    const [lastMediaIdString] = lastId.split('_');
    const [nextMediaIdString] = pagination.next_max_id.split('_');
    const lastMediaId = new BigNumber(lastMediaIdString, 10);
    const nextMediaId = new BigNumber(nextMediaIdString, 10);

    if (lastMediaId.gte(nextMediaId)) {
      return null;
    }
  }

  return Promise
    .bind(this, [pagination.next_url, accessToken, lastId])
    .spread(syncAccountHistory);
}

module.exports = syncAccountHistory;
