const Errors = require('common-errors');
const mapKeys = require('lodash/mapKeys');
const Promise = require('bluebird');
const snakeCase = require('lodash/snakeCase');

function fetchFeedMapper(entry) {
  const { id, changes } = entry;

  return this.facebook.feed
    .getByNetworkId('facebook', id)
    .then((feed) => {
      const response = { changes };

      if (feed) {
        response.feed = feed;
      } else {
        this.facebook.logger.error(`Feed not found for user #${id}`);
      }

      return response;
    });
}

function applyMediaChangesMapper(entry) {
  const { feed, changes } = entry;
  const { logger, media: facebookMedia } = this.facebook;

  return Promise
    .filter(changes, (change) => change.field === 'feed')
    .map((change) => {
      const accessToken = feed.meta.token;
      const action = change.value.verb;
      const postId = change.value.post_id;
      let promise;

      // no post-id - dont do anything
      if (postId == null) {
        return null;
      }

      switch (action) {
        case 'add':
        case 'edited':
          promise = facebookMedia
            .fetch(postId, accessToken)
            .then((media) => facebookMedia.save(media));
          break;

        case 'remove':
          promise = facebookMedia.delete(postId);
          break;

        default:
          promise = Promise.reject(new Error('Not implemented'));
      }

      return promise
        .then(() => ({ action, postId }))
        .catch((error) => {
          logger.error(`Error ${action} for post #${postId}:`, error);
        });
    })
    // remove unsuccessful actions
    .filter((change) => change != null);
}

function webhookResponseReducer(response, changes) {
  changes.forEach((change) => {
    if (change) response[change.action] += 1;
  });

  return response;
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
      .each((subcription) => logger.info('Facebook subcription:', subcription))
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

    if (subscriptions.map((subscription) => subscription.verifyToken).includes(verifyToken)) {
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
      .map(fetchFeedMapper)
      .filter((entry) => entry.feed != null)
      .map(applyMediaChangesMapper)
      .reduce(webhookResponseReducer, { add: 0, remove: 0, edited: 0 });
  }
}

module.exports = Subscription;
