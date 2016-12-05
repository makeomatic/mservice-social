const { NotFoundError } = require('common-errors');
const Promise = require('bluebird');
const register = require('./feed/register');
const sinon = require('sinon');

const services = new WeakMap();

class Feed {
  constructor(logger) {
    this.logger = logger;

    services.set(this, new Map());
  }

  service(name, instance) {
    const classServices = services.get(this);

    if (instance) {
      classServices.set(name, instance);
    }

    if (classServices.has(name) === false) {
      throw new NotFoundError(`Service ${name}`);
    }

    return classServices.get(name);
  }

  getByNetworkId(network, networkId) {
    return this
      .service('storage')
      .feeds()
      .getByNetworkId(network, networkId);
  }

  register(data) {
    return register.call(this, data);
  }

  list(data) {
    return this
      .service('storage')
      .feeds()
      .list(data);
  }

  read(data) {
    return this
      .service('storage')
      .twitterStatuses()
      .list(data);
  }

  remove(data) {
    const facebook = this.service('facebook');
    const storage = this.service('storage');
    const twitter = this.service('twitter');

    const process = Promise.coroutine(function* action() {
      const feeds = yield storage.feeds().list({ filter: data });
      if (feeds.length === 0) {
        return;
      }

      const { network, meta: { account } } = feeds[0];
      yield storage.feeds().remove(data);

      // @TODO realize it later, need to refactor totally
      if (!data.keep_data && network === 'twitter') {
        yield storage
          .twitterStatuses()
          .remove({ account });
      }

      twitter.connect();

      for (const feed of feeds) { // eslint-disable-line no-restricted-syntax
        if (feed.network === 'facebook') {
          const { network_id: pageId, meta: { token } } = feed;

          yield facebook.subscription.unsubscribeApp(pageId, token);
        }
      }
    });

    return process();
  }
}

module.exports = Feed;
