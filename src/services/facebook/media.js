const Promise = require('bluebird');
const syncAccountHistory = require('./media/sync-account-history');

class Media {
  constructor(facebook) {
    this.facebook = facebook;
  }

  list(params) {
    return this.facebook.storage.facebookMedia().list(params);
  }

  syncPagesHistory() {
    return this.facebook.storage
      .feeds()
      .list({ filter: { network: 'facebook' } })
      .map(feed => Promise.join(feed, this.getLastId(feed.network_id)))
      .map(([feed, lastId]) => this.syncPageHistory(feed.network_id, feed.meta.token, lastId));
  }

  syncPageHistory(id, accessToken, lastId) {
    const { fields } = this.facebook.config.api;
    const requestOptions = {
      qs: {
        fields,
        limit: '100',
      },
      url: `/${id}/feed`,
    };

    return syncAccountHistory.call(this, requestOptions, accessToken, lastId);
  }

  getLastId(userId) {
    return this.facebook.storage
      .facebookMedia()
      .getLastId(userId);
  }

  fetch(id, accessToken) {
    const { fields } = this.facebook.config.api;
    const options = {
      url: `/${id}`,
      qs: { fields },
    };

    return this.facebook.request(options, accessToken);
  }

  save(media) {
    const { logger } = this.facebook;
    const [pageId, postId] = media.id.split('_');
    const data = {
      id: postId,
      page_id: pageId,
      created_time: new Date(),
      meta: JSON.stringify(media),
    };

    return this.facebook.storage
      .facebookMedia()
      .save(data)
      .then(mediaData => logger.info('Save facebook media', mediaData));
  }

  delete(id) {
    const [pageId, postId] = id.split('_');

    return this.facebook.storage
      .facebookMedia()
      .delete(postId, pageId);
  }
}

module.exports = Media;
