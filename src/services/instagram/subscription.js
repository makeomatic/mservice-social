const Errors = require('common-errors');
const mapKeys = require('lodash/mapKeys');
const Promise = require('bluebird');
const request = require('request-promise');
const snakeCase = require('lodash/snakeCase');

const subscriptionUrl = 'https://api.instagram.com/v1/subscriptions/';

function subscribeMapper(subscription) {
  const { id, secret } = this;
  const params = Object.assign({}, { clientId: id, clientSecret: secret }, subscription);
  const formData = mapKeys(params, (value, key) => snakeCase(key));

  return request.post({ url: subscriptionUrl, formData });
}

function getMediaMapper(subscription) {
  const { object_id: networkId, data: { media_id: mediaId } } = subscription;

  return this.feed
    .getByNetworkId('instagram', networkId)
    .then((feed) => {
      if (feed) {
        return Promise
          .join(
            this.media.fetch(mediaId, feed.meta.token),
            this.comments.fetch(mediaId, feed.meta.token)
          )
          .spread((media, comments) => ({ media, comments }))
          .catch((error) => {
            this.logger.error(`Failed to init #${networkId}`, error);
          });
      }

      this.logger.error(`Feed not found for user #${networkId}`);

      return null;
    });
}

class Subscription {
  constructor(config, feed, media, comments, logger) {
    this.config = config;
    this.comments = comments;
    this.feed = feed;
    this.media = media;
    this.logger = logger;
  }

  subscribe() {
    const { logger, config } = this;
    const { client, subscriptions } = config;

    return Promise
      .bind(client, subscriptions)
      .map(subscribeMapper)
      .each(subcription => logger.info('Instagram subcription:', subcription))
      .catch((e) => {
        logger.error('Failed to subscribe', e);
      });
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
    return Promise
      .bind(this, params)
      .map(getMediaMapper)
      .filter(media => media !== null)
      .map(media => this.media.save(media))
      .then(({ length }) => ({ media: length }));
  }
}

module.exports = Subscription;
