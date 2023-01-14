const FacebookMedia = require('./storage/facebook-media');
const Feeds = require('./storage/feeds');
const InstagramMedia = require('./storage/instagram-media');
const TwitterStatuses = require('./storage/twitter-statuses');

const facebookMedia = new WeakMap();
const feeds = new WeakMap();
const instagramMedia = new WeakMap();
const twitterStatuses = new WeakMap();

class Storage {
  constructor(knex) {
    this.client = knex;

    facebookMedia.set(this, new FacebookMedia(knex, 'facebook_media'));
    feeds.set(this, new Feeds(knex, 'feeds'));
    instagramMedia.set(this, new InstagramMedia(knex, 'instagram_media'));
    twitterStatuses.set(this, new TwitterStatuses(knex, 'statuses'));
  }

  facebookMedia() {
    return facebookMedia.get(this);
  }

  feeds() {
    return feeds.get(this);
  }

  instagramMedia() {
    return instagramMedia.get(this);
  }

  twitterStatuses() {
    return twitterStatuses.get(this);
  }
}

module.exports = Storage;
