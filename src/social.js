const { Microfleet, ConnectorsTypes } = require('@microfleet/core');
const { NotFoundError } = require('common-errors');
const Deepmerge = require('@fastify/deepmerge');

const prepareStore = require('./config');
const Feed = require('./services/feed');
const Storage = require('./services/storage');
const Twitter = require('./services/twitter/twitter');
const Facebook = require('./services/facebook');
const Notifier = require('./services/notifier');
const Instagram = require('./services/instagram');
const addUpsert = require('./utils/knex/upsert');
const k = require('./constants');

const services = new WeakMap();

class Social extends Microfleet {
  async register() {
    await super.register();

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
    this.service(k.SERVICE_STORAGE, new Storage(this.knex));
  }

  initFeed() {
    const { log } = this;
    const storage = this.service(k.SERVICE_STORAGE);
    const feed = new Feed(log);

    feed.service(k.SERVICE_STORAGE, storage);
    this.service(k.SERVICE_FEED, feed);
  }

  initFacebook() {
    const { config, log } = this;
    const feed = this.service(k.SERVICE_FEED);
    const storage = this.service(k.SERVICE_STORAGE);
    const facebook = new Facebook(this, config.facebook, storage, feed, log);

    this.addConnector(ConnectorsTypes.application, () => facebook.init(), 'facebook');

    /* so that it stops before database is closed, but after transport is unavailable */
    this.addDestructor(ConnectorsTypes.migration, () => facebook.destroy(), 'facebook');

    this.service(k.SERVICE_FACEBOOK, facebook);
    feed.service(k.SERVICE_FACEBOOK, facebook);
  }

  initInstagram() {
    const { config, log } = this;
    const feed = this.service(k.SERVICE_FEED);
    const storage = this.service(k.SERVICE_STORAGE);
    const instagram = new Instagram(this, config.instagram, storage, log);

    this.addConnector(ConnectorsTypes.application, () => instagram.media().init(), 'instagram');
    this.addDestructor(ConnectorsTypes.migration, () => instagram.media().destroy(), 'instagram');

    this.service(k.SERVICE_INSTAGRAM, instagram);
    feed.service(k.SERVICE_INSTAGRAM, instagram);
  }

  initTwitter() {
    const { config, log } = this;
    const feed = this.service(k.SERVICE_FEED);
    const storage = this.service(k.SERVICE_STORAGE);
    const twitter = new Twitter(this, config.twitter, storage, log);

    this.addConnector(ConnectorsTypes.application, () => twitter.init(), 'twitter');

    /* so that it stops before database is closed, but after transport is unavailable */
    this.addDestructor(ConnectorsTypes.migration, () => twitter.destroy(), 'twitter');

    this.service(k.SERVICE_TWITTER, twitter);
    feed.service(k.SERVICE_TWITTER, twitter);
  }

  initNotifier() {
    const { connect, close } = Notifier.connector(this);

    // need to start up before any application
    this.addConnector(ConnectorsTypes.migration, connect, 'notifier');

    // need to close right before shutdown to publish updates
    this.addDestructor(ConnectorsTypes.essential, close);
  }
}

const deepmerge = Deepmerge({
  mergeArray(options) {
    const { clone } = options;
    return (target, source) => {
      return clone(source);
    };
  },
});

module.exports = async function initSocial(opts = {}) {
  const store = await prepareStore({ env: process.env.NODE_ENV });
  const config = store.get('/');
  const social = new Social(deepmerge(config, opts));
  return social;
};

module.exports.Social = Social;
