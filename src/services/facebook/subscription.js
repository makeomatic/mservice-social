const Errors = require('common-errors');
const flatten = require('lodash/flatten');
const mapKeys = require('lodash/mapKeys');
const Promise = require('bluebird');
const request = require('request-promise');
const snakeCase = require('lodash/snakeCase');

function getSubscriptionUrl(appId, appSecret) {
  return `https://graph.facebook.com/${appId}/subscriptions?access_token=${appId}|${appSecret}`;
}

function getSubscribeAppUrl(pageId, token) {
  return `https://graph.facebook.com/${pageId}/subscribed_apps?access_token=${token}`;
}

function subscribeMapper(subscription) {
  const { id, secret } = this;
  const params = Object.assign({}, subscription);
  const formData = mapKeys(params, (value, key) => snakeCase(key));
  const url = getSubscriptionUrl(id, secret);

  return request.post({ url, formData });
}

function getMediaMapper(entry) {
  const { id, changes } = entry;

  return this.feed
    .getByNetworkId('facebook', id)
    .then((feed) => {
      if (feed) {
        return Promise
          .filter(changes, change => change.value.verb === 'add' && change.field === 'feed')
          .map(change => this.media.fetch(change.value.post_id, feed.meta.token));
      }

      this.logger.warn(`Feed not found for user #${id}`);

      return [];
    });
}

class Subscription {
  constructor(config, feed, media, logger) {
    this.config = config;
    this.feed = feed;
    this.media = media;
    this.logger = logger;
  }

  subscribe() {
    const { logger, config } = this;
    const { app, subscriptions } = config;

    return Promise
      .bind(app, subscriptions)
      .map(subscribeMapper)
      .each(subcription => logger.info('Facebook subcription:', subcription))
      .catch((e) => {
        logger.error('Failed to subscribe', e);
      });
  }

  subscribeApp(pageId, token) {
    const url = getSubscribeAppUrl(pageId, token);

    return Promise.resolve(request.post({ url }));
  }

  verify(params) {
    const { subscriptions } = this.config;
    const { 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = params;

    if (subscriptions.map(subscription => subscription.verifyToken).includes(verifyToken)) {
      return challenge;
    }

    throw new Errors.NotPermittedError(`Verify token ${verifyToken} is invalid`);
  }

  save(params) {
    if (params.object !== 'page') {
      throw new Errors.NotImplementedError(`Facebook subscription type ${params.object}`);
    }

    return Promise
      .bind(this, params.entry)
      .map(getMediaMapper)
      .filter(media => media.length > 0)
      .then(media => flatten(media))
      .map(media => this.media.save(media))
      .then(({ length }) => ({ media: length }));
  }
}

module.exports = Subscription;
