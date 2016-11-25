const Media = require('./instagram/media');
const Subscription = require('./instagram/subscription');

const media = new WeakMap();
const subscription = new WeakMap();

class InstagramService {
  constructor(config, storage, feed, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;
    const instagramMedia = new Media(config, storage, logger);

    media.set(this, instagramMedia);
    subscription.set(this, new Subscription(config, feed, instagramMedia, logger));
  }

  media() {
    return media.get(this);
  }

  subscription() {
    return subscription.get(this);
  }
}

module.exports = InstagramService;
