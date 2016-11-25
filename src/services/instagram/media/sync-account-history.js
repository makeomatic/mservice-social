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

function saveMedia(response) {
  const { lastId, instagramMedia } = this;
  const data = lastId ? filterLessThanId(response.data, lastId) : response.data;

  return Promise.map(data, media => instagramMedia.save(media));
}

function syncAccountHistory(url, lastId) {
  const instagramMedia = this;
  const options = { url, json: true };

  return Promise
    .resolve(request.get(options))
    .bind({ lastId, instagramMedia })
    .tap(saveMedia)
    .then(paginate);
}

function paginate(response) {
  const { lastId, instagramMedia } = this;
  const { pagination } = response;

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
    .bind(instagramMedia, [pagination.next_url, lastId])
    .spread(syncAccountHistory);
}

module.exports = syncAccountHistory;
