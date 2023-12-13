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
  // const accountsCursor = await storage.feeds().accountsCursor(expandedAccounts, 'twitter');

  const saveAccountJobs = [];
  // const syncAccountJobs = [];
  for (let i = 0; i < accounts.length; i += 1) {
    const feed = clone(original);
    const feedMeta = {
      account_id: expandedAccounts[i].id,
      account: expandedAccounts[i].username,
    };

    feed.network_id = feedMeta.account_id;
    feed.meta = JSON.stringify(feedMeta);

    // wait till storage is registered then syncs tweets
    saveAccountJobs.push(storage.feeds().save(feed));
    // syncAccountJobs.push(() => twitter.syncAccount({
    //   ...feedMeta,
    //   cursor: accountsCursor[feed.network_id],
    // }));
  }

  await Promise.all(saveAccountJobs);

  // return amount of accounts
  logger.info(`Saved ${accounts.length} accounts`);

  // await (async () => {
  //   try {
  //     const results = await Promise.allSettled(syncAccountJobs.map((job) => job()));
  //
  //     for (const [idx, result] of results.entries()) {
  //       if (result.status !== 'fulfilled') {
  //         logger.warn({ err: result.reason, account: accounts[idx] }, 'failed to sync');
  //       }
  //     }
  //
  //     // update Twitter feed
  //     await twitter.connect();
  //   } catch (e) {
  //     logger.error({ err: e }, 'failed to perform async op');
  //   }
  // })();

  return accounts;
}

module.exports = register;
