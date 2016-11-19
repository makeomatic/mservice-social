const Promise = require('bluebird');
const fb = require('fbgraph');

const get = Promise.promisify(fb.get);
const url = require('url');
const moment = require('moment-timezone');

const { NotPermittedError } = require('common-errors');

const { find, map, reduce } = require('lodash');

function extractAccount(accum, value) {
  const accountId = value.meta.account_id;

  // if we have accountId & we dont have it yet
  if (accountId && !find(accum, { account_id: accountId })) {
    accum.push(value.meta);
  }

  return accum;
}

class FacebookService {
  constructor(config, feed) {
    this.config = config;
    this.feed = feed;
    this.logger = feed.logger;
    this.name = 'facebook';
    return this.init().then(() => this.logger.info('Facebook initialized')).then(() => this);
  }

  async init() {
    const feeds = await this.feed.list({ filter: { network: 'twitter' } });
    const accounts = reduce(feeds, extractAccount, []);
    const sync = map(accounts, async account => await this.syncAccount(account, false));
    return Promise.all(sync);
  }

  refresh() {
    // TODO: something here?
  }

  expandAccounts(accounts) {
    return accounts; // don't need to do anything
  }

  async syncAccount(_account, fresh = true) {
    const { feed, logger } = this;
    const { account, account_id: id, access_token } = _account;
    logger.info(`Syncing ${account}-facebook`);
    try {
      // get the latest post
      let latest;

      if (!fresh) {
        latest = await feed.getLatestStatusByAccountId(id, 'facebook');
      }

      if (fresh || latest === null) {
        latest = await get(`${id}/feed`, {
          fields: 'created_time',
          access_token,
          limit: 1,
        });

        if (latest.data.length === 0) {
          logger.info(`Account ${account}-facebook sync finished, no posts found.`);
          return;
        }
      }

      // start with latest post
      const until = moment(latest.data[0].created_time).valueOf() / 1000;
      const since = moment(latest.data[0].created_time).subtract(90, 'days').valueOf() / 1000;

      // now get all posts we can
      await this.fetch(since, until, _account);
    } catch (e) {
      logger.error(e);
    }
    logger.info(`Account ${account}-facebook sync finished.`);
  }

  /**
   * Fetches all statuses between since and until dates.
   * @param _since Start date
   * @param _until End date
   * @param account Account info { access_token, id/account_id }
   */
  async fetch(_since, _until, _account) {
    let since = _since;
    let until = _until;
    let size = -1;
    let pagingToken = '';
    let count = 0;
    const { feed, logger } = this;
    const { account, account_id: id, access_token } = _account;
    while (size !== 0) {
      const params = {
        fields: ['attachments', 'message', 'story', 'created_time', 'comments'].join(','),
        access_token,
        since,
        until,
      };
      if (pagingToken !== '') {
        params.__paging_token = pagingToken;
      }
      const response = await get(`${id}/feed`, params);

      response.data.forEach(function saveStatus(inStatus) {
        const meta = {
          id_str: inStatus.id,
          account,
          account_id: id,
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
        feed.insertStatus(outStatus);
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

      logger.info(`Got ${size} statuses from ${account}-facebook`);
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
    const { feed } = this;
    // get user id whose feed we need to fetch
    const accountIds = data.entry.map(entry => (entry.id));
    const statuses = accountIds.map(async (accountId) => {
      const ourFeed = await feed.getByAccountId(accountId, 'facebook');
      const ourLatest = await feed.getLatestStatusByAccountId(accountId, 'facebook');
      const { meta: account } = ourFeed;
      const { date: since } = ourLatest;
      return await this.fetch(since, Date.now(), account);
    }, this);
    return Promise.reduce(statuses, (total, synced) => (total + synced), 0);
  }
}

module.exports = exports = FacebookService;
