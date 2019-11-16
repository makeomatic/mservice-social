const Promise = require('bluebird');
const getListUrl = require('./media/get-list-url');
const getMediaUrl = require('./media/get-url');
const syncAccountHistory = require('./media/sync-account-history');

class Media {
  constructor(instagram, instagramComments) {
    this.instagram = instagram;
    this.config = instagram.config;
    this.storage = instagram.storage;
    this.logger = instagram.logger;
    this.comments = instagramComments;
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
    const stats = {
      failed: [],
      total: 0,
      start: process.hrtime(),
    };

    this.logger.debug('instagram: sync started');

    return feeds
      .list({ filter: { network: 'instagram', invalid: false } })
      .map((feed) => Promise.join(feed, instagramMedia.getLastId(feed.network_id)))
      .tap((toFetch) => {
        stats.total = toFetch.length;
      })
      .map(([feed, lastId]) => (
        this.syncAccountHistory(feed.meta.token, lastId)
          .catch((error) => {
            this.logger.error(`Failed to sync account "${feed.network_id}" history`, error);
            stats.failed.push(feed.network_id);
          })
      ))
      .tap(() => {
        setImmediate(() => {
          this.logger.debug('instagram: sync finished in', process.hrtime(stats.start));
          this.logger.debug('instagram: total accounts', stats.total);
          this.logger.debug('instagram: with success', stats.total - stats.failed.length);
          this.logger.debug('instagram: with failure', stats.failed);
        });
      });
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

    return this.instagram
      .request(options, accessToken)
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
      .then((mediaData) => logger.info('Save instagram media', mediaData));
  }
}

module.exports = Media;
