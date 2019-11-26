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
    this.closing = false;
  }

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.closing = true;
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
          .catch((err) => {
            this.logger.error({ err }, 'Failed to sync account "%s" history', feed.network_id);
            stats.failed.push(feed.network_id);
          })
      ))
      .tap(() => {
        const opts = {
          finishedIn: process.hrtime(stats.start),
          total: stats.total,
          success: stats.total - stats.failed.length,
          failed: stats.failed,
        };
        this.logger.info(opts, 'instagram: sync finished');
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
        this.logger.info({ syncInterval }, 'scheduling instagram sync');
        try {
          await this.syncAccountsHistory();
        } catch (err) {
          this.logger.error({ err }, 'failed to sync instagram');
        }

        if (this.closing === false) {
          this.timeout = setTimeout(intervalSync, syncInterval);
        }
      };

      await intervalSync();
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
      .then((mediaData) => logger.info({ mediaData }, 'Save instagram media'));
  }
}

module.exports = Media;
