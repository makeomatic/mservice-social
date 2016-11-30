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

  remove(data) {
    const storage = this.service('storage');
    const twitter = this.service('twitter');

    const process = Promise.coroutine(function* action() {
      const feed = yield storage.feeds().list({ filter: data });
      if (feed.length === 0) {
        return;
      }

      const { meta: { account } } = feed[0];
      yield storage.feeds().remove(data);

      if (!data.keep_data) {
        yield storage
          .twitterStatuses()
          .remove({ account });
      }

      twitter.connect();
    });

    return process();
  }
}

module.exports = Feed;
