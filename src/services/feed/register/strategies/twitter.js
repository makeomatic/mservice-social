const clone = require('lodash/clone');
const omit = require('lodash/omit');

async function register(data) {
  const { logger } = this;
  const { accounts } = data;
  const storage = this.service('storage');
  const twitter = this.service('twitter');
  const original = omit(data, 'accounts');
  const expandedAccounts = await twitter.fillUserIds(accounts);

  for (let i = 0; i < accounts.length; i += 1) {
    const feed = clone(original);

    feed.network_id = expandedAccounts[i].id;
    feed.meta = JSON.stringify({
      account_id: feed.network_id,
      account: expandedAccounts[i].username,
    });

    // wait till storage is registered
    await storage.feeds().save(feed); // eslint-disable-line no-await-in-loop

    // syncs tweets
    await twitter.syncAccount(expandedAccounts[i].username); // eslint-disable-line no-await-in-loop
  }

  // update twitter feed
  twitter.connect();

  // return amount of accounts
  logger.info(`Registered ${accounts.length} accounts`);

  return accounts;
}

module.exports = register;
