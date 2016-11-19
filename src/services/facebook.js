const Promise = require('bluebird');
const fb = require('fbgraph');

const get = Promise.promisify(fb.get);
const url = require('url');
const moment = require('moment-timezone');

const { NotPermittedError } = require('common-errors');

class FacebookService {
  constructor(config, storage, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
    this.name = 'facebook';
  }

  refresh() {
  }

  expandAccounts(accounts) {
    return accounts; // don't need to do anything
  }

  async syncAccount(account) {
    const { logger } = this;
    logger.info(`Syncing ${account.username}-facebook`);
    try {
      // get the latest post
      const latest = await get(`${account.id}/feed`, {
        fields: 'created_time',
        access_token: account.access_token,
        limit: 1,
      });

      if (latest.data.length === 0) {
        logger.info(`Account ${account.username}-facebook sync finished, no posts found.`);
        return;
      }

      // start with latest post
      const until = moment(latest.data[0].created_time).valueOf() / 1000;
      const since = moment(latest.data[0].created_time).subtract(90, 'days').valueOf() / 1000;

      // now get all posts we can
      await this.fetch(since, until, account);
    } catch (e) {
      logger.error(e);
    }
    logger.info(`Account ${account.username}-facebook sync finished.`);
  }

  /**
   * Fetches all statuses between since and until dates.
   * @param _since Start date
   * @param _until End date
   * @param account Account info { access_token, id/account_id }
   */
  async fetch(_since, _until, account) {
    let since = _since;
    let until = _until;
    let size = -1;
    let pagingToken = '';
    let count = 0;
    const { storage, logger } = this;
    while (size !== 0) {
      const params = {
        fields: ['attachments', 'message', 'story', 'created_time', 'comments'].join(','),
        access_token: account.access_token,
        since,
        until,
      };
      if (pagingToken !== '') {
        params.__paging_token = pagingToken;
      }
      const response = await get(`${account.id || account.account_id}/feed`, params);

      response.data.forEach(function saveStatus(inStatus) {
        const meta = {
          id_str: inStatus.id,
          account: account.username || account.account,
          account_id: account.id || account.account_id,
          attachments: inStatus.attachments,
          comments: inStatus.comments,
          story: inStatus.story,
        };
        const outStatus = {
          id: inStatus.id,
          network: 'facebook',
          date: inStatus.created_time,
          text: inStatus.message || inStatus.story,
          meta: JSON.stringify(meta),
        };
        storage.insertStatus(outStatus);
      });

      // paging exists only when where are results, so it's okay to just skip it
      // size will stop the cycle
      if (response.paging) {
        const query = url.parse(response.paging.next, true).query;
        since = query.since;
        until = query.until;
        pagingToken = query.__paging_token;
      }
      size = response.data.length;

      count += size;

      logger.info(`Got ${size} statuses from ${account.username || account.account}-facebook`);
    }
    return count;
  }

  async verifySubscription(data) {
    const { subscriptions } = this.config;
    const { 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = data;

    if (subscriptions.map(subscription => subscription.verifyToken).includes(verifyToken)) {
      return challenge;
    }

    throw new NotPermittedError(`Verify token ${verifyToken} is invalid`);
  }

  async saveStatus(data) {
    const { storage } = this;
    // get user id whose feed we need to fetch
    const accountIds = data.entry.map(entry => (entry.id));
    const statuses = accountIds.map(async (accountId) => {
      const feed = await storage.getFeedByAccountId(accountId, 'facebook');
      const ourLatest = await storage.getLatestStatusByAccountId(accountId, 'facebook');
      const { meta: account } = feed;
      const { date: since } = ourLatest;
      return await this.fetch(since, Date.now(), account);
    }, this);
    return Promise.reduce(statuses, (total, synced) => (total + synced), 0);
  }
}

module.exports = exports = FacebookService;