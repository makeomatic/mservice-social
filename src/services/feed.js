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

  async register(data) {
    if (!this._hasNetwork(data.network)) {
      throw new NotSupportedError(`${data.network} is not currently supported`);
    }

    const { storage, networks, logger } = this;
    const network = networks[data.network];

    const accounts = data.filter.accounts;
    const original = omit(data, 'filter');
    // must return array of account objects: { id, username }
    const expandedAccounts = await network.expandAccounts(accounts);

    for (let i = 0; i < accounts.length; i += 1) {
      const feed = clone(original);

      feed.network_id = expandedAccounts[i].id;
      feed.meta = JSON.stringify({
        account_id: feed.network_id,
        account: expandedAccounts[i].username,
      });

      // wait till storage is registered
      await storage.registerFeed(feed);

      // sync feed
      await network.syncAccount(expandedAccounts[i]);
    }

    // start listening
    await network.refresh();

    // log that we finished
    logger.info(`Registered ${expandedAccounts.length} accounts`);

    return expandedAccounts;
  }

  list(data) {
    return this.storage.listFeeds(data);
  }

  read(data) {
    return this.storage.readStatuses(data);
  }

  async remove(data) {
    const { storage, networks } = this;
    const feed = await storage.listFeeds({ filter: data });
    if (feed.length === 0) {
      return;
    }

    const { meta: { account } } = feed[0];
    await storage.removeFeed(data);

    if (!data.keep_data) {
      await storage.removeStatuses({ account, network: data.network });
    }

    if (data.network && networks[data.network]) {
      await networks[data.network].refresh();
    }
  }
}

module.exports = Feed;
