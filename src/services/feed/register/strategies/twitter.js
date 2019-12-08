const Promise = require('bluebird');
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
  const syncAccountJobs = [];
  for (let i = 0; i < accounts.length; i += 1) {
    const feed = clone(original);

    feed.network_id = expandedAccounts[i].id;
    feed.meta = JSON.stringify({
      account_id: feed.network_id,
      account: expandedAccounts[i].username,
    });

    // wait till storage is registered then syncs tweets
    saveAccountJobs.push(storage.feeds().save(feed));
    syncAccountJobs.push(() => twitter.syncAccount(expandedAccounts[i].username));
  }

  await Promise.all(saveAccountJobs);

  // return amount of accounts
  logger.info(`Saved ${accounts.length} accounts`);

  process.nextTick(async () => {
    try {
      const results = await Promise.allSettled(syncAccountJobs.map((job) => job()));
      for (const [idx, result] of results) {
        if (result.status !== 'fulfilled') {
          logger.warn({ err: result.reason, account: accounts[idx] }, 'failed to sync');
        }
      }

      // update twitter feed
      twitter.connect();
    } catch (e) {
      logger.error({ err: e }, 'failed to perform async op');
    }
  });

  return accounts;
}

module.exports = register;
