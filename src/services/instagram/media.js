const getListUrl = require('./media/get-list-url');
const getMediaUrl = require('./media/get-url');
const Promise = require('bluebird');
const request = require('request-promise');
const syncAccountHistory = require('./media/sync-account-history');

class Media {
  constructor(config, storage, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
  }

  list(params) {
    return this.storage.instagramMedia().list(params);
  }

  syncAccountsHistory() {
    const feeds = this.storage.feeds();
    const instagramMedia = this.storage.instagramMedia();

    return feeds
      .list({ filter: { network: 'instagram' } })
      .map(feed => Promise.join(feed, instagramMedia.getLastId(feed.network_id)))
      .map(([feed, lastId]) => this.syncAccountHistory(feed.network_id, feed.meta.token, lastId));
  }

  syncAccountHistory(id, token, lastId) {
    const url = getListUrl(id, token);

    return Promise
      .bind(this, [url, lastId])
      .spread(syncAccountHistory);
  }

  getLastId(userId) {
    return this.storage.instagramMedia().getLastId(userId);
  }

  fetch(id, accessToken) { // eslint-disable-line class-methods-use-this
    const options = { url: getMediaUrl(id, accessToken), json: true };

    return request
      .get(options)
      .then(response => response.data);
  }

  save(media) {
    const { logger } = this;
    const { user: { id: userId, username } } = media;
    const [id] = media.id.split('_');
    const data = {
      id,
      username,
      user_id: userId,
      created_time: new Date(),
      meta: JSON.stringify(media),
    };

    return this.storage
      .instagramMedia()
      .save(data)
      .then(mediaData => logger.info('Save instagram media', mediaData));
  }
}

module.exports = Media;
