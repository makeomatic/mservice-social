const BigNumber = require('bn.js');
const request = require('request-promise');
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

function syncAccountHistory(url, accessToken, lastId) {
  const options = { url, json: true };
  let pagination = {};

  return Promise
    .bind(this, options)
    .then(request.get)
    .tap(response => (pagination = response.pagination))
    .get('data')
    .then(data => (lastId ? filterLessThanId(data, lastId) : data))
    .map(media => fetchComments.call(this, media, accessToken))
    .map(media => this.save(media))
    .then(() => paginate.call(this, pagination, accessToken, lastId));
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
