const _ = require('lodash');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const StorageService = require('./services/storage');
const TwitterService = require('./services/twitter');
const FeedService = require('./services/feed');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

class Social extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(_.merge({}, defaultConfig, config));

    const storage = new StorageService(this.config.storage);
    const twitter = new TwitterService(this.config.twitter, storage, this.log);
    const feed = new FeedService(this.config.feed);

    this.services = {
      storage,
      twitter,
      feed,
    };
  }
}

module.exports = Social;
