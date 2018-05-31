const getListUrl = require('./media/get-list-url');
const getMediaUrl = require('./media/get-url');
const Promise = require('bluebird');
const request = require('request-promise');
const syncAccountHistory = require('./media/sync-account-history');

class Media {
  constructor(config, instagramComments, storage, logger) {
    this.config = config;
    this.comments = instagramComments;
    this.storage = storage;
    this.logger = logger;
    this.timeout = null;
  }

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
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
      .map(([feed, lastId]) => (
        this.syncAccountHistory(feed.meta.token, lastId)
          .catch((error) => {
            this.logger.error(`Failed to sync account "${feed.network_id}" history`, error);
          })
      ));
  }

  syncAccountHistory(accessToken, lastId) {
    const url = getListUrl(accessToken);

    return Promise
      .bind(this, [url, accessToken, lastId])
      .spread(syncAccountHistory);
  }

  async init() {
    const { syncMediaOnStart, syncOnInterval, syncInterval } = this.config;

    if (syncMediaOnStart) {
      await this.syncAccountsHistory();
    }

    if (syncOnInterval) {
      const intervalSync = async () => {
        await this.syncAccountsHistory();
        this.timeout = setTimeout(intervalSync, syncInterval);
      };
      this.timeout = setTimeout(intervalSync, syncInterval);
    }
  }

  getLastId(userId) {
    return this.storage.instagramMedia().getLastId(userId);
  }

  fetch(id, accessToken) { // eslint-disable-line class-methods-use-this
    const options = { url: getMediaUrl(id, accessToken), json: true };

    return Promise
      .resolve(request.get(options))
      .get('data');
  }

  save({ media, comments }) {
    const { logger } = this;
    const { user: { id: userId, username } } = media;
    const [id] = media.id.split('_');
    const data = {
      id,
      username,
      user_id: userId,
      created_time: new Date(),
      meta: JSON.stringify({ comments, media }),
    };

    return this.storage
      .instagramMedia()
      .save(data)
      .then(mediaData => logger.info('Save instagram media', mediaData));
  }
}

module.exports = Media;
