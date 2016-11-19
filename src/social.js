const addUpsert = require('./utils/knex/upsert');
const merge = require('lodash/merge');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const { ConnectorsTypes } = MService;
const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

const Feed = require('./services/feed');

class Social extends MService {
  /**
   * @param config
   */
  constructor(config = {}) {
    super(merge({}, defaultConfig, config));

    // make knex better
    addUpsert(this.knex);

    // migrations
    this.addConnector(ConnectorsTypes.migration, () => this.migrate('knex'));
  }

  async connect() {
    // connect on init
    await super.connect();
    this.services = {
      feed: await new Feed(this),
    };
  }
}

Social.NETWORK_INSTAGRAM = 'instagram';
Social.NETWORK_FACEBOOK = 'facebook';
Social.NETWORK_TWITTER = 'twitter';

Social.SERVICE_INSTAGRAM = 'instagram';
Social.SERVICE_FACEBOOK = 'facebook';
Social.SERVICE_FEED = 'feed';
Social.SERVICE_TWITTER = 'twitter';

module.exports = Social;
