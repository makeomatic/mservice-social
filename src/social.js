const addUpsert = require('./utils/knex/upsert');
const merge = require('lodash/merge');
const { globFiles } = require('ms-conf/lib/load-config');
const MService = require('mservice');
const path = require('path');

const services = require('./services');

const { ConnectorsTypes } = MService;
const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));

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

    const storage = await new services.Storage(this.knex);
    const networks = {};
    networks.twitter = await new services.Twitter(this.config.twitter, storage, this.log);
    networks.facebook = await new services.Facebook(this.config.facebook, storage, this.log);
    if (this.config.instagram.enabled) {
      networks.instagram = await new services.Instagram(this.config.instagram, this.knex, this.log);
    }
    const feed = await new services.Feed(storage, networks, this.log);

    this.services = {
      feed,
      instagram: networks.instagram,
      facebook: networks.facebook,
    };
  }
}

module.exports = Social;
