const Comments = require('./instagram/comments');
const Media = require('./instagram/media');

const comments = new WeakMap();
const media = new WeakMap();

class InstagramService {
  constructor(config, storage, feed, logger) {
    this.config = config;
    this.storage = storage;
    this.logger = logger;

    const instagramComments = new Comments(config);
    const instagramMedia = new Media(config, instagramComments, storage, logger);

    comments.set(this, instagramComments);
    media.set(this, instagramMedia);
  }

  comments() {
    return comments.get(this);
  }

  media() {
    return media.get(this);
  }
}

module.exports = InstagramService;
