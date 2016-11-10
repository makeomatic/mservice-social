const Promise = require('bluebird');
const { NotSupportedError } = require('common-errors');
const { omit, clone, keys } = require('lodash');

class Feed {
  constructor(storage, networks, logger) {
    this.storage = storage;
    this.networks = networks;
    this.logger = logger;
  }

  _hasNetwork(network) {
    if (this._networkList === undefined) {
      this._networkList = keys(this.networks);
    }

    return this._networkList.indexOf(network) >= 0;
  }

  register(data) {
    if (!this._hasNetwork(data.network)) {
      throw new NotSupportedError(`${data.network} is not currently supported`);
    }

    const { storage, networks, logger } = this;
    const network = networks[data.network];

    const process = Promise.coroutine(function* action() {
      const accounts = data.filter.accounts;
      const original = omit(data, 'filter');
      // must return array of account objects: { id, username }
      const expandedAccounts = yield network.expandAccounts(accounts);

      for (let i = 0; i < accounts.length; i += 1) {
        const feed = clone(original);

        feed.network_id = expandedAccounts[i].id;
        feed.filter = JSON.stringify({
          account_id: feed.network_id,
          account: expandedAccounts[i].username,
        });

        // wait till storage is registered
        yield storage.registerFeed(feed);

        // sync feed
        yield network.syncAccount(expandedAccounts[i].username);
      }

      // start listening
      network.refresh();

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
