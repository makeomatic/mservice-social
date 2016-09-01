const _ = require('lodash');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const StorageService = require('./services/storage');
const TwitterService = require('./services/twitter');

const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

/**
 * @property {object}      Chat.services
 * @property {RoomService} Chat.services.room
 */
class Social extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(_.merge({}, defaultConfig, config));

    const storage = new StorageService(this.config.storage);
    const twitter = new TwitterService(this.config.twitter);

    this.services = {
      storage,
      twitter,
    };
  }
}

module.exports = Social;
