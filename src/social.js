const addUpsert = require('./utils/knex/upsert');
const Errors = require('common-errors');
const merge = require('lodash/merge');
const { globFiles } = require('ms-conf/lib/load-config');
const InstagramService = require('./services/instagram');
const MService = require('mservice');
const path = require('path');
const StorageService = require('./services/storage');
const TwitterService = require('./services/twitter');
const FeedService = require('./services/feed');

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

    // services
    const { instagram: instagramConfig, twitter: twitterConfig } = this.config;
    const storage = new StorageService(this.knex);
    const twitter = new TwitterService(twitterConfig, storage, this.log);
    const feed = new FeedService(storage, twitter, this.log);

    if (instagramConfig.enabled) {
      const instagram = new InstagramService(instagramConfig, this.knex, this.log);

      this.addConnector(ConnectorsTypes.transport, () => instagram.subscribe());
      this.addConnector(ConnectorsTypes.transport, () => instagram.syncMediaHistory());
      this.addService('instagram', instagram);
      feed.instagram = instagram;
    }

    this.addConnector(ConnectorsTypes.transport, () => twitter.init());
    this.addService('storage', storage);
    this.addService('twitter', twitter);
    this.addService('feed', feed);
  }

  addService(name, instance) {
    if (this.services === undefined) {
      this.services = {};
    }

    this.services[name] = instance;
  }

  getService(name) {
    if (this.services === undefined || this.services[name] === undefined) {
      throw new Errors.NotFoundError(`Service '${name}' not found`);
    }

    return this.services[name];
  }
}

module.exports = Social;
