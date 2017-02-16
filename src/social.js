const addUpsert = require('./utils/knex/upsert');
const Facebook = require('./services/facebook');
const Feed = require('./services/feed');
const { globFiles } = require('ms-conf/lib/load-config');
const Instagram = require('./services/instagram');
const merge = require('lodash/merge');
const MService = require('mservice');
const { NotFoundError } = require('common-errors');
const path = require('path');
const Promise = require('bluebird');
const Storage = require('./services/storage');
const Twitter = require('./services/twitter');

const { ConnectorsTypes } = MService;
const defaultConfig = globFiles(path.resolve(__dirname, 'configs'));
const services = new WeakMap();

class Social extends MService {
  constructor(config = {}) {
    super(merge({}, defaultConfig, config));

    this.initServices();
    this.initKnex();
    this.initStorage();
    this.initFeed();

    if (this.config.facebook.enabled) {
      this.initFacebook();
    }

    if (this.config.instagram.enabled) {
      this.initInstagram();
    }

    if (this.config.twitter.enabled) {
      this.initTwitter();
    }

    // migrations
    this.addConnector(ConnectorsTypes.migration, () => this.migrate('knex'));
  }

  service(name, instance) {
    const classServices = services.get(this);

    if (instance) {
      classServices.set(name, instance);
    }

    if (classServices.has(name) === false) {
      throw new NotFoundError(`Service ${name}`);
    }

    return classServices.get(name);
  }

  initServices() {
    services.set(this, new Map());
  }

  initKnex() {
    addUpsert(this.knex);
  }

  initStorage() {
    this.service(Social.SERVICE_STORAGE, new Storage(this.knex));
  }

  initFeed() {
    const { log } = this;
    const storage = this.service(Social.SERVICE_STORAGE);
    const feed = new Feed(log);

    feed.service(Social.SERVICE_STORAGE, storage);
    this.service(Social.SERVICE_FEED, feed);
  }

  initFacebook() {
    const { config, log } = this;
    const feed = this.service(Social.SERVICE_FEED);
    const storage = this.service(Social.SERVICE_STORAGE);
    const facebook = new Facebook(config.facebook, storage, feed, log);

    if (config.facebook.subscribeOnStart) {
      this.addConnector(ConnectorsTypes.application, () =>
        Promise
          .delay(1000)
          .then(() => facebook.subscription.subscribe())
      );
    }

    if (config.facebook.syncMediaOnStart) {
      this.addConnector(ConnectorsTypes.application, () => facebook.media.syncPagesHistory());
    }

    this.service(Social.SERVICE_FACEBOOK, facebook);
    feed.service(Social.SERVICE_FACEBOOK, facebook);
  }

  initInstagram() {
    const { config, log } = this;
    const feed = this.service(Social.SERVICE_FEED);
    const storage = this.service(Social.SERVICE_STORAGE);
    const instagram = new Instagram(config.instagram, storage, feed, log);

    if (config.instagram.subscribeOnStart) {
      this.addConnector(ConnectorsTypes.application, () =>
        Promise
          .delay(1000)
          .then(() => instagram.subscription().subscribe())
      );
    }

    if (config.instagram.syncMediaOnStart) {
      this.addConnector(ConnectorsTypes.application, () => instagram.media().syncAccountsHistory());
    }

    this.service(Social.SERVICE_INSTAGRAM, instagram);
    feed.service(Social.SERVICE_INSTAGRAM, instagram);
  }

  initTwitter() {
    const { config, log } = this;
    const feed = this.service(Social.SERVICE_FEED);
    const storage = this.service(Social.SERVICE_STORAGE);
    const twitter = new Twitter(config.twitter, storage, log);

    this.addConnector(ConnectorsTypes.application, () => twitter.init());

    this.service(Social.SERVICE_TWITTER, twitter);
    feed.service(Social.SERVICE_TWITTER, twitter);
  }
}

Social.SERVICE_FACEBOOK = 'facebook';
Social.SERVICE_FEED = 'feed';
Social.SERVICE_INSTAGRAM = 'instagram';
Social.SERVICE_STORAGE = 'storage';
Social.SERVICE_TWITTER = 'twitter';

module.exports = Social;
