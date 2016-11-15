const BigNumber = require('bn.js');
const Errors = require('common-errors');
const mapKeys = require('lodash/mapKeys');
const Promise = require('bluebird');
const request = require('request-promise');
const snakeCase = require('lodash/snakeCase');

const subscriptionUrl = 'https://api.instagram.com/v1/subscriptions/';

const subscribeMapper = (clientId, clientSecret) => (subscription) => {
  const params = Object.assign({}, { clientId, clientSecret }, subscription);
  const formData = mapKeys(params, (value, key) => snakeCase(key));

  return request.post({ url: subscriptionUrl, formData });
};

const getMediaUrl = (id, token) =>
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

function validateAccount(account) {
  if (account.id === undefined) {
    throw new Errors.ValidationError('Instagram account id must be present');
  }

  if (account.username === undefined) {
    throw new Errors.ValidationError('Instagram account username must be present');
  }

  if (account.token === undefined) {
    throw new Errors.ValidationError('Instagram account token must be present');
  }
}

class InstagramService {
  constructor(config, knex, logger) {
    this.config = config;
    this.knex = knex;
    this.logger = logger;
  }

  async init() {
    await this.subscribe();
    await this.syncMediaHistory();
  }

  expandAccounts(accounts) {
    accounts.forEach(validateAccount);
    return accounts;
  }

  syncAccount(account) {
    const { id, token } = account;
    return this.syncUserMediaHistory(id, token);
  }

  refresh() {}

  syncMediaHistory() {
    return this
      .knex('feeds')
      .where('network', 'instagram')
      .select(['network_id', 'meta'])
      .map(feed => (this
        .getLastMediaId(feed.network_id)
        .then(result => Object.assign({ lastId: result.id }, feed))
      ))
      .map(feed => this.syncUserMediaHistory(feed.network_id, feed.meta.token, feed.lastId));
  }

  syncUserMediaHistory(id, token, lastId) {
    const url = getMediaUrl(id, token);

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

    return knex
      .insert(data, 'id')
      .into('instagram_media')
      .then(mediaId => logger.info(`Save instagram media #${mediaId}`));
  }

  mediaList(params) {
    const { id, username } = params;
    const query = this
      .knex('instagram_media')
      .orderBy('id', 'desc');

    if (id) {
      return query.where('user_id', id);
    }

    if (username) {
      return query.where('username', username);
    }

    throw new Errors.ArgumentError();
  }

  subscribe() {
    const { logger, config } = this;
    const { client, subscriptions } = config;

    return Promise
      .map(subscriptions, subscribeMapper(client.id, client.secret))
      .each(subcription => logger.info('Instagram subcription:', subcription));
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
