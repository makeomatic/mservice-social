const merge = require('lodash/merge');
const { Microfleet, ConnectorsTypes } = require('@microfleet/core');
const Promise = require('bluebird');
const { NotFoundError } = require('common-errors');

const conf = require('./config');
const Feed = require('./services/feed');
const Storage = require('./services/storage');
const Twitter = require('./services/twitter/twitter');
const Facebook = require('./services/facebook');
const Notifier = require('./services/notifier');
const Instagram = require('./services/instagram');
const addUpsert = require('./utils/knex/upsert');
const { interceptTwitterApi } = require('./services/twitter/intercepts');

const services = new WeakMap();

if (process.env.INTERCEPT_TWITTER_API) {
  interceptTwitterApi();
}

class Social extends Microfleet {
  static defaultConfig = conf.get('/', {
    env: process.env.NODE_ENV,
  });

  constructor(config = {}) {
    super(merge({}, Social.defaultConfig, config));

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

    if (this.config.notifier.enabled) {
      this.initNotifier();
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
    const facebook = new Facebook(this, config.facebook, storage, feed, log);

    if (config.facebook.subscribeOnStart) {
      this.addConnector(ConnectorsTypes.application, () => Promise
        .delay(60000)
        .then(() => facebook.subscription.subscribe()));
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
    const instagram = new Instagram(this, config.instagram, storage, log);

    this.addConnector(ConnectorsTypes.application, () => instagram.media().init(), 'instagram');
    this.addDestructor(ConnectorsTypes.migration, () => instagram.media().destroy(), 'instagram');

    this.service(Social.SERVICE_INSTAGRAM, instagram);
    feed.service(Social.SERVICE_INSTAGRAM, instagram);
  }

  initTwitter() {
    const { config, log } = this;
    const feed = this.service(Social.SERVICE_FEED);
    const storage = this.service(Social.SERVICE_STORAGE);
    const twitter = new Twitter(this, config.twitter, storage, log);

    this.addConnector(ConnectorsTypes.application, () => twitter.init(), 'twitter');

    /* so that it stops before database is closed, but after transport is unavailable */
    this.addDestructor(ConnectorsTypes.migration, () => twitter.destroy(true), 'twitter');

    this.service(Social.SERVICE_TWITTER, twitter);
    feed.service(Social.SERVICE_TWITTER, twitter);
  }

  initNotifier() {
    const { connect, close } = Notifier.connector(this);

    // need to start up before any application
    this.addConnector(ConnectorsTypes.migration, connect, Notifier.SERVICE_NOTIFIER);

    // need to close right before shutdown to publish updates
    this.addDestructor(ConnectorsTypes.essential, close);
  }
}

Social.SERVICE_FACEBOOK = 'facebook';
Social.SERVICE_FEED = 'feed';
Social.SERVICE_INSTAGRAM = 'instagram';
Social.SERVICE_STORAGE = 'storage';
Social.SERVICE_TWITTER = 'twitter';

module.exports = Social;
