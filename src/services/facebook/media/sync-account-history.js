const last = require('lodash/last');
const moment = require('moment');
const Promise = require('bluebird');
const url = require('url');

function filterLessThanId(data, lastMedia) {
  const lastMediaCreatedTime = moment(lastMedia.created_time);

  return data.filter(media => lastMediaCreatedTime.isAfter(media.created_time));
}

function filterMediaAndSave(data, lastMedia) {
  const media = lastMedia ? filterLessThanId(data, lastMedia) : data;

  return Promise
    .bind(this, media)
    .map(this.save);
}

function needPaginate(response, lastMedia) {
  const { paging, data } = response;

  if (paging === undefined) {
    return false;
  }

  if (lastMedia) {
    return moment(last(data).created_time).isBefore(lastMedia.created_time);
  }

  return true;
}

function syncAccountHistory(requestOptions, accessToken, lastMedia) {
  return this.facebook
    .request(requestOptions, accessToken)
    .tap(response => filterMediaAndSave.call(this, response.data, lastMedia))
    .then((response) => {
      if (needPaginate(response, lastMedia) === false) {
        return true;
      }

      const { next } = response.paging;
      const nextRequestOptions = Object.assign({}, requestOptions);

      nextRequestOptions.qs = url.parse(next, true).query;

      return Promise
        .bind(this, [nextRequestOptions, accessToken, lastMedia])
        .spread(syncAccountHistory);
    });
}

module.exports = syncAccountHistory;
