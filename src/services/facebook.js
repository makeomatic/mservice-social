const { Facebook } = require('fb');

class FacebookService {
  constructor(config, storage, logger) {
    this.client = new Facebook(config);
    this.storage = storage;
    this.logger = logger;
  }
}

module.exports = exports = FacebookService;
