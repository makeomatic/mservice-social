const BigNumber = require('bn.js');
const Errors = require('common-errors');
const getMediaUrl = require('./instagram/get-media-url');
const mapKeys = require('lodash/mapKeys');
const Promise = require('bluebird');
const request = require('request-promise');
const ServiceMedia = require('./instagram/media');
const snakeCase = require('lodash/snakeCase');

const subscriptionUrl = 'https://api.instagram.com/v1/subscriptions/';

const subscribeMapper = (clientId, clientSecret) => (subscription) => {
  const params = Object.assign({}, { clientId, clientSecret }, subscription);
  const formData = mapKeys(params, (value, key) => snakeCase(key));

  return request.post({ url: subscriptionUrl, formData });
};

const getMediaListUrl = (id, token) =>
  `https://api.instagram.com/v1/users/${id}/media/recent?access_token=${token}&count=200`;

function getFilteredMedia(data, lastId) {
  const [lastMediaIdString] = lastId.split('_');
  const lastMediaId = new BigNumber(lastMediaIdString, 10);

  return data.filter((media) => {
    const [mediaIdString] = media.id.split('_');
    const mediaId = new BigNumber(mediaIdString, 10);

    return lastMediaId.lt(mediaId);
  });
}

function syncMedia(url, lastId) {
  const options = { url, json: true };

  return request
    .get(options)
    .then((response) => {
      const { pagination, data } = response;
      const result = lastId
        ? getFilteredMedia(data, lastId)
        : data;
      const needBreak = data.length !== result.length;

      return Promise
        .map(result, media => this.saveMedia(media))
        .then(() => {
          if (needBreak) {
            return null;
          }

          if (pagination.next_url) {
            return Promise
              .bind(this, [pagination.next_url, lastId])
              .spread(syncMedia);
          }

          return null;
        });
    });
}

class InstagramService {
  constructor(config, knex, logger) {
    this.config = config;
    this.knex = knex;
    this.logger = logger;
    this.media = new ServiceMedia(knex);
  }

  syncMediaHistory() {
    return this
      .knex('feeds')
      .where('network', 'instagram')
      .select(['network_id', 'meta'])
      .map(feed => (this
        .getLastMediaId(feed.network_id)
        .then(result => Object.assign({ lastId: (result ? result.id : null) }, feed))
      ))
      .map(feed => this.syncUserMediaHistory(feed.network_id, feed.meta.token, feed.lastId));
  }

  syncUserMediaHistory(id, token, lastId) {
    const url = getMediaListUrl(id, token);

    return Promise
      .bind(this, [url, lastId])
      .spread(syncMedia);
  }

  getLastMediaId(userId) {
    return this
      .knex('instagram_media')
      .where('user_id', userId)
      .orderBy('id', 'desc')
      .first('id');
  }

  fetchMedia(id, accessToken) { // eslint-disable-line class-methods-use-this
    const options = { url: getMediaUrl(id, accessToken), json: true };

    return request
      .get(options)
      .then(response => response.data);
  }

  saveMedia(media) {
    const { knex, logger } = this;
    const { id, user: { id: userId, username } } = media;
    const data = {
      id,
      username,
      user_id: userId,
      created_time: new Date(),
      meta: JSON.stringify(media),
    };

    return knex.upsertItem('instagram_media', 'id', data)
      .then(mediaData => logger.info('Save instagram media', mediaData));
  }

  mediaList(params) {
    return this.media.list(params);
  }

  subscribe() {
    const { logger, config } = this;
    const { client, subscriptions } = config;

    return Promise
      .map(subscriptions, subscribeMapper(client.id, client.secret))
      .each(subcription => logger.info('Instagram subcription:', subcription))
      .catch((e) => {
        logger.error('failed to subscribe', e);
      });
  }

  verifySubcription(params) {
    const { subscriptions } = this.config;
    const { 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = params;

    if (subscriptions.map(subscription => subscription.verifyToken).includes(verifyToken)) {
      return challenge;
    }

    throw new Errors.NotPermittedError(`Verify token ${verifyToken} is invalid`);
  }
}

module.exports = InstagramService;
