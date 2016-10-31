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
      const accounts = data.filter.accounts;
      const original = omit(data, 'filter');
      const expandedAccounts = yield twitter.fillUserIds(accounts);

      for (let i = 0; i < accounts.length; i += 1) {
        const feed = clone(original);

        feed.network_id = expandedAccounts[i].id;
        feed.filter = JSON.stringify({
          account_id: feed.network_id,
          account: expandedAccounts[i].username,
        });

        // wait till storage is registered
        yield storage.registerFeed(feed);

        // syncs tweets
        yield twitter.syncAccount(expandedAccounts[i].username);
      }

      // update twitter feed
      twitter.connect();

      // return amount of accounts
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

  remove(data) {
    const { storage, twitter } = this;
    const process = Promise.coroutine(function* action() {
      const feed = yield storage.listFeeds({ filter: data });
      if (feed.length === 0) {
        return;
      }

      const { filter: { account } } = feed[0];
      yield storage.removeFeed(data);

      if (!data.keep_data) {
        yield storage.removeStatuses({ account });
      }

      twitter.connect();
    });

    return process();
  }
}

module.exports = Feed;
