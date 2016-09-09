const _ = require('lodash');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const StorageService = require('./services/storage');
const TwitterService = require('./services/twitter');
const FeedService = require('./services/feed');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

const Promise = require('bluebird');

class Social extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(_.merge({}, defaultConfig, config));

    const init = Promise.coroutine(function* initServices() {
      const storage = new StorageService(this.config.storage);
      const twitter = new TwitterService(this.config.twitter, storage, this.log);
      const feed = new FeedService(storage);


      // sequentially initialize services
      yield storage.init();
      yield twitter.init();

      this.services = {
        storage,
        twitter,
        feed,
      };
    }).bind(this);

    init();
  }
}

module.exports = Social;
