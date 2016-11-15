const clone = require('lodash/clone');
const omit = require('lodash/omit');
const Promise = require('bluebird');

function register(data) {
  const { storage, twitter, logger } = this;
  const process = Promise.coroutine(function* action() {
    const accounts = data.filter.accounts;
    const original = omit(data, 'filter');
    const expandedAccounts = yield twitter.fillUserIds(accounts);

    for (let i = 0; i < accounts.length; i += 1) {
      const feed = clone(original);

      feed.network_id = expandedAccounts[i].id;
      feed.meta = JSON.stringify({
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
    return accounts;
  });

  return process()
    .tap(({ length }) => {
      logger.info(`Registered ${length} accounts`);
    });
}

module.exports = register;
