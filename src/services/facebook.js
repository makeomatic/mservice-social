const Promise = require('bluebird');
const fb = require('fbgraph');

const get = Promise.promisify(fb.get);

class FacebookService {
  constructor(config, storage, logger) {
    this.storage = storage;
    this.logger = logger;
  }

  init() {}

  refresh() {}

  expandAccounts(accounts) {
    return accounts; // don't need to do anything
  }

  async syncAccount(account) {
    const { logger } = this;
    try {
      const response = await get(`me/feed?access_token=${account.access_token}`, {
        fields: ['attachments', 'message', 'story', 'created_time', 'comments'].join(','),
      });

      logger.info('Response', response);
    } catch (e) {
      logger.error(e);
    }
  }
}

module.exports = exports = FacebookService;
