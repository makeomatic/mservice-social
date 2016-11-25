const Media = require('./facebook/media');
const Subscription = require('./facebook/subscription');

const media = new WeakMap();
const subscription = new WeakMap();

class Facebook {
  constructor(config, storage, feed, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
    const facebookMedia = new Media(config, storage, logger);

    media.set(this, facebookMedia);
    subscription.set(this, new Subscription(config, feed, facebookMedia, logger));
  }

  media() {
    return media.get(this);
  }

  subscription() {
    return subscription.get(this);
  }
}

module.exports = Facebook;
