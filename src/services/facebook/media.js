const Promise = require('bluebird');
const get = require('lodash/get');
const syncAccountHistory = require('./media/sync-account-history');
const extractLinks = require('./links-extractor');

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
      .list({ filter: { network: 'facebook', invalid: false } })
      .map(feed => Promise.join(feed, this.getLast(feed.network_id)))
      .map(([feed, lastMedia]) => this.syncPageHistory(feed.network_id, feed.meta.token, lastMedia));
  }

  syncPageHistory(id, accessToken, lastMedia) {
    const { logger, config: { api: { fields } } } = this.facebook;
    const requestOptions = {
      qs: {
        fields,
        limit: '100',
      },
      url: `/${id}/feed`,
    };

    return syncAccountHistory
      .call(this, requestOptions, accessToken, lastMedia)
      .catch((error) => {
        logger.error(`Can't sync page history for "${id}":`, get(error, 'error', error.message));
      });
  }

  getLast(pageId) {
    return this.facebook.storage
      .facebookMedia()
      .getLast(pageId);
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
    const { created_time: createdTime } = media;
    const data = {
      id: postId,
      page_id: pageId,
      created_time: createdTime,
      meta: JSON.stringify(extractLinks(media)),
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
