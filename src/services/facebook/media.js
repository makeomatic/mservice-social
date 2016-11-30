const Promise = require('bluebird');
const request = require('request-promise');
const syncAccountHistory = require('./media/sync-account-history');

class Media {
  constructor(config, storage, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
  }

  getListUrl(pageId, token) {
    const { version, fields } = this.config.api;

    return 'https://graph.facebook.com/'
      + `${version}/${pageId}/feed?access_token=${token}&fields=${fields}&limit=100`;
  }

  getPostUrl(postId, token) {
    const { version, fields } = this.config.api;

    return `https://graph.facebook.com/${version}/${postId}?access_token=${token}&fields=${fields}`;
  }

  list(params) {
    return this.storage.facebookMedia().list(params);
  }

  syncPagesHistory() {
    return this.storage
      .feeds()
      .list({ filter: { network: 'facebook' } })
      .map(feed => Promise.join(feed, this.getLastId(feed.network_id)))
      .map(([feed, lastId]) => this.syncPageHistory(feed.network_id, feed.meta.token, lastId));
  }

  syncPageHistory(id, token, lastId) {
    const url = this.getListUrl(id, token);

    return Promise
      .bind(this, [url, lastId])
      .spread(syncAccountHistory);
  }

  getLastId(userId) {
    return this.storage
      .facebookMedia()
      .getLastId(userId);
  }

  fetch(id, accessToken) {
    const options = { url: this.getPostUrl(id, accessToken), json: true };

    return request.get(options);
  }

  save(media) {
    const { logger } = this;
    const [pageId, postId] = media.id.split('_');
    const data = {
      id: postId,
      page_id: pageId,
      created_time: new Date(),
      meta: JSON.stringify(media),
    };

    return this.storage
      .facebookMedia()
      .save(data)
      .then(mediaData => logger.info('Save facebook media', mediaData));
  }
}

module.exports = Media;
