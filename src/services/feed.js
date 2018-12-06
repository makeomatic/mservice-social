const { NotFoundError } = require('common-errors');
const Promise = require('bluebird');
const register = require('./feed/register');

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

  async remove(data) {
    const storage = this.service('storage');
    const feeds = await storage.feeds().list({ filter: data });

    if (feeds.length === 0) {
      return;
    }

    const { network, meta: { account } } = feeds[0];
    await storage.feeds().remove(data);

    // @TODO realize it later, need to refactor totally
    if (!data.keep_data && network === 'twitter') {
      await storage
        .twitterStatuses()
        .remove({ account });
    }

    try {
      // schedule resync
      this.service('twitter').connect();
    } catch (e) {
      this.logger.info(e);
    }

    try {
      const facebook = this.service('facebook');
      const acts = [];
      for (const feed of feeds) { // eslint-disable-line no-restricted-syntax
        if (feed.network === 'facebook') {
          const { network_id: pageId, meta: { token } } = feed;
          acts.push(facebook.subscription.unsubscribeApp(pageId, token));
        }
      }

      if (acts.length > 0) await Promise.all(acts);
    } catch (e) {
      this.logger.info(e);
    }
  }
}

module.exports = Feed;
