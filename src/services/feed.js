const Promise = require('bluebird');
const omit = require('lodash/omit');
const clone = require('lodash/clone');

class Feed {
  constructor(storage, twitter, logger) {
    this.storage = storage;
    this.twitter = twitter;
    this.logger = logger;
  }

  register(data) {
    const { storage, twitter, logger } = this;
    const process = Promise.coroutine(function* action() {
      const accounts = data.filter.account;
      const original = omit(data, 'filter');
      const ids = yield twitter.getUserId(accounts);

      for (let i = 0; i < accounts.length; i += 1) {
        const feed = clone(original);
        feed.filter = {
          account: accounts[i],
          account_id: ids[i],
        };
        yield storage.registerFeed(feed);
      }

      yield twitter.init();
      return accounts.length;
    });
    return process().then((size) => {
      logger.info(`Registered ${size} accounts`);
    });
  }

  list(data) {
    return this.storage.listFeeds(data);
  }

  read(data) {
    return this.storage.readStatuses(data);
  }
}

module.exports = Feed;
