const BigNumber = require('bn.js');
const last = require('lodash/last');
const request = require('request-promise');
const Promise = require('bluebird');

function filterLessThanId(data, lastId) {
  const lastMediaId = new BigNumber(lastId, 10);

  return data.filter((media) => {
    const [, mediaIdString] = media.id.split('_');
    const mediaId = new BigNumber(mediaIdString, 10);

    return lastMediaId.lt(mediaId);
  });
}

function saveMedia(response) {
  const { lastId, facebookMedia } = this;
  const data = lastId ? filterLessThanId(response.data, lastId) : response.data;

  return Promise.map(data, media => facebookMedia.save(media));
}

function paginate(response) {
  const { lastId, facebookMedia } = this;
  const { paging, data } = response;

  if (paging === undefined) {
    return null;
  }

  if (lastId) {
    const [, nextMediaIdString] = last(data).id.split('_');
    const lastMediaId = new BigNumber(lastId, 10);
    const nextMediaId = new BigNumber(nextMediaIdString, 10);

    if (lastMediaId.gte(nextMediaId)) {
      return null;
    }
  }

  return Promise
    .bind(facebookMedia, [paging.next, lastId])
    .spread(syncAccountHistory);
}

function syncAccountHistory(url, lastId) {
  const facebookMedia = this;
  const options = { url, json: true };

  return Promise
    .resolve(request.get(options))
    .bind({ lastId, facebookMedia })
    .tap(saveMedia)
    .then(paginate);
}

module.exports = syncAccountHistory;
