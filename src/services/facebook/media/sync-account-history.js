const BigNumber = require('bn.js');
const last = require('lodash/last');
const Promise = require('bluebird');
const url = require('url');

function filterLessThanId(data, lastId) {
  const lastMediaId = new BigNumber(lastId, 10);

  return data.filter((media) => {
    const [, mediaIdString] = media.id.split('_');
    const mediaId = new BigNumber(mediaIdString, 10);

    return lastMediaId.lt(mediaId);
  });
}

function filterMediaAndSave(data, lastId) {
  const media = lastId ? filterLessThanId(data, lastId) : data;

  return Promise
    .bind(this, media)
    .map(this.save);
}

function needPaginate(response, lastId) {
  const { paging, data } = response;

  if (paging === undefined) {
    return false;
  }

  if (lastId) {
    const [, nextMediaIdString] = last(data).id.split('_');
    const lastMediaId = new BigNumber(lastId, 10);
    const nextMediaId = new BigNumber(nextMediaIdString, 10);

    if (lastMediaId.gte(nextMediaId)) {
      return false;
    }
  }

  return true;
}

function syncAccountHistory(requestOptions, accessToken, lastId) {
  return this.facebook
    .request(requestOptions, accessToken)
    .tap(response => filterMediaAndSave.call(this, response.data, lastId))
    .then((response) => {
      if (needPaginate(response, lastId) === false) {
        return true;
      }

      const { next } = response.paging;
      const nextRequestOptions = Object.assign({}, requestOptions);

      nextRequestOptions.qs = url.parse(next, true).query;

      return Promise
        .bind(this, [nextRequestOptions, accessToken, lastId])
        .spread(syncAccountHistory);
    });
}

module.exports = syncAccountHistory;
