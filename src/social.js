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
    const twitter = await new services.Twitter(this.config.twitter, storage, this.log);
    const facebook = await new services.Facebook(this.config.facebook, storage, this.log);
    const instagram = await new services.Instagram(this.config.instagram, this.knex, this.log);
    const feed = await new services.Feed(storage, { twitter, facebook, instagram }, this.log);

    // sequentially initialize services
    await storage.init();
    await twitter.init();
    await facebook.init();
    await instagram.init();

    this.services = {
      storage,
      twitter,
      facebook,
      instagram,
      feed,
    };
  }
}

module.exports = Social;
