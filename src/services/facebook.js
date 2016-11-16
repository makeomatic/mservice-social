const Promise = require('bluebird');
const fb = require('fbgraph');

const get = Promise.promisify(fb.get);
const url = require('url');
const moment = require('moment-timezone');

class FacebookService {
  constructor(config, storage, logger) {
    this.storage = storage;
    this.logger = logger;
  }

  refresh() {}

  expandAccounts(accounts) {
    return accounts; // don't need to do anything
  }

  async syncAccount(account) {
    const { storage, logger } = this;
    logger.info(`Syncing ${account.username}-facebook`);
    let since;
    let until;
    let size = -1;
    let pagingToken = '';
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
      until = moment(latest.data[0].created_time).valueOf() / 1000;
      since = moment(latest.data[0].created_time).subtract(90, 'days').valueOf() / 1000;

      // now get all posts we can
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
        const response = await get(`${account.id}/feed`, params);

        response.data.forEach(function saveStatus(inStatus) {
          const meta = {
            id_str: inStatus.id,
            account: account.username,
            account_id: account.id,
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

        logger.info(`Got ${size} statuses from ${account.username}-facebook`);
      }
    } catch (e) {
      logger.error(e);
    }
    logger.info(`Account ${account.username}-facebook sync finished.`);
  }
}

module.exports = exports = FacebookService;
