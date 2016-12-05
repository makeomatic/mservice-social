const Errors = require('common-errors');
const flatten = require('lodash/flatten');
const mapKeys = require('lodash/mapKeys');
const Promise = require('bluebird');
const snakeCase = require('lodash/snakeCase');

function getMediaMapper(entry) {
  const { id, changes } = entry;

  return this.facebook.feed
    .getByNetworkId('facebook', id)
    .then((feed) => {
      if (feed) {
        return Promise
          .filter(changes, change => change.value.verb === 'add' && change.field === 'feed')
          .map(change => this.facebook.media.fetch(change.value.post_id, feed.meta.token));
      }

      this.facebook.logger.warn(`Feed not found for user #${id}`);

      return [];
    });
}

class Subscription {
  constructor(facebook) {
    this.facebook = facebook;
  }

  subscribe() {
    const { logger, config } = this.facebook;
    const { app, subscriptions } = config;

    return Promise
      .map(subscriptions, (subscription) => {
        const options = {
          formData: mapKeys(subscription, (value, key) => snakeCase(key)),
          json: false,
          method: 'post',
          qs: { access_token: `${app.id}|${app.secret}` },
          url: `/${app.id}/subscriptions`,
        };

        return this.facebook.request(options);
      })
      .each(subcription => logger.info('Facebook subcription:', subcription))
      .catch((e) => {
        logger.error('Failed to subscribe', e);
      });
  }

  subscribeApp(pageId, token) {
    const options = {
      url: `/${pageId}/subscribed_apps`,
      method: 'post',
    };

    return this.facebook.request(options, token);
  }

  unsubscribeApp(pageId, token) {
    const options = {
      url: `/${pageId}/subscribed_apps`,
      method: 'delete',
    };

    return this.facebook.request(options, token);
  }

  verify(params) {
    const { subscriptions } = this.facebook.config;
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
      .map(media => this.facebook.media.save(media))
      .then(({ length }) => ({ media: length }));
  }
}

module.exports = Subscription;
