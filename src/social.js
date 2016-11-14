const _ = require('lodash');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const StorageService = require('./services/storage');
const TwitterService = require('./services/twitter');
const FacebookService = require('./services/facebook');
const FeedService = require('./services/feed');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

class Social extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(_.merge({}, defaultConfig, config));
  }

  async connect() {
    // connect on init
    await super.connect();

    const storage = new StorageService(this.knex);
    const twitter = new TwitterService(this.config.twitter, storage, this.log);
    const facebook = new FacebookService(this.config.facebook, storage, this.log);
    const feed = new FeedService(storage, { twitter, facebook }, this.log);

    // sequentially initialize services
    await storage.init();
    await twitter.init();
    await facebook.init();

    this.services = {
      storage,
      twitter,
      facebook,
      feed,
    };
  }
}

module.exports = Social;
