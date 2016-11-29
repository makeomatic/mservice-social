const Comments = require('./instagram/comments');
const Media = require('./instagram/media');
const Subscription = require('./instagram/subscription');

const comments = new WeakMap();
const media = new WeakMap();
const subscription = new WeakMap();

class InstagramService {
  constructor(config, storage, feed, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;

    const instagramComments = new Comments(config);
    const instagramMedia = new Media(config, instagramComments, storage, logger);

    comments.set(this, instagramComments);
    media.set(this, instagramMedia);
    subscription.set(this, new Subscription(config, feed, instagramMedia, instagramComments, logger));
  }

  comments() {
    return comments.get(this);
  }

  media() {
    return media.get(this);
  }

  subscription() {
    return subscription.get(this);
  }
}

module.exports = InstagramService;
