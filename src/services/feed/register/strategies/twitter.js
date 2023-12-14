const clone = require('lodash/clone');
const omit = require('lodash/omit');

async function register(data) {
  const { logger } = this;
  const { accounts } = data;
  const storage = this.service('storage');
  const twitter = this.service('twitter');
  const original = omit(data, 'accounts');

  /*
  * Expand and validate accounts
  */
  const expandedAccounts = await twitter.fillUserIds(accounts);
  const saveAccountJobs = [];

  for (let i = 0; i < accounts.length; i += 1) {
    const feed = clone(original);
    const feedMeta = {
      account_id: expandedAccounts[i].id,
      account: expandedAccounts[i].username,
    };

    feed.network_id = feedMeta.account_id;
    feed.meta = JSON.stringify(feedMeta);

    saveAccountJobs.push(storage.feeds().save(feed));
  }

  await Promise.all(saveAccountJobs);
  // saved accounts will be synced upon next tweet sync cycle

  // return amount of accounts
  logger.info(`Saved ${accounts.length} accounts`);

  return accounts;
}

module.exports = register;
