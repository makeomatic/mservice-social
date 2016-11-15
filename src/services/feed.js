const Errors = require('common-errors');
const Promise = require('bluebird');
const instagramRegisterStrategy = require('./feed/register/instagram');
const twitterRegisterStrategy = require('./feed/register/twitter');

class Feed {
  constructor(storage, twitter, logger) {
    this.storage = storage;
    this.twitter = twitter;
    this.logger = logger;
  }

  register(data) {
    const promise = Promise.bind(this, data);

    if (data.network === 'twitter') {
      return promise.then(twitterRegisterStrategy);
    }

    if (data.network === 'instagram') {
      return promise.then(instagramRegisterStrategy);
    }

    throw new Errors.NotImplementedError(`'feed.register' for '${data.network}'`);
  }

  list(data) {
    return this.storage.listFeeds(data);
  }

  read(data) {
    return this.storage.readStatuses(data);
  }

  remove(data) {
    const { storage, twitter } = this;
    const process = Promise.coroutine(function* action() {
      const feed = yield storage.listFeeds({ filter: data });
      if (feed.length === 0) {
        return;
      }

      const { meta: { account } } = feed[0];
      yield storage.removeFeed(data);

      if (!data.keep_data) {
        yield storage.removeStatuses({ account });
      }

      twitter.connect();
    });

    return process();
  }
}

module.exports = Feed;
