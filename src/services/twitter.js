const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const { isObject, isString, isArray, conforms, merge } = require('lodash');

/**
 * @property {TwitterClient} client
 * @property {array} listeners
 * @property {Knex} knex
 * @property {Logger} logger
 */
class Twitter {
  /**
   * @param {object} config
   * @param {StorageService} storage
   * @param {Logger} logger
   */
  constructor(config, storage, logger) {
    this.client = new TwitterClient(config);
    this.listener = null;
    this.storage = storage;
    this.logger = logger;

    // cheaper than bind
    this.onData = json => this._onData(json);
    this.onError = err => this._onError(err);
  }

  init() {
    return this.storage
      .fetchFeeds({ network: 'twitter' })
      .bind(this)
      .then(this.listen)
      .catch(this.error);
  }

  listen(rows) {
    if (this.reconnect && this.reconnect.isPending()) {
      return null;
    }

    // cleanup
    this.reconnect = null;

    const accounts = rows.reduce(function extractAccount(accum, value) {
      if (value.filter.account && accum.indexOf(value.filter.account) < 0) {
        accum.push(value.filter.account_id);
      }
      return accum;
    }, []);

    const params = {};

    if (accounts.length > 0) {
      params.follow = accounts.join(',');
    }

    if (!params.follow) {
      return false;
    }

    const listener = this.listener;

    // setup new listener while old is still active
    this.listener = this.client.stream('statuses/filter', params);
    this.listener.on('data', this.onData);
    this.listener.on('error', this.onError);

    // remove old listener
    // minimizes chances we dont miss messages
    if (listener !== null) {
      listener.destroy();
    }

    this.logger.info(`Listening for ${accounts.length} accounts on ${rows[0].network}`);
    return true;
  }

  log(results) {
    let data = results;
    if (!isArray(data)) {
      data = [results];
    }

    data.map(this.logger.info.bind(this.logger));
  }

  _onError(exception) {
    this.logger.error('stream connection failed', exception);

    // reconnect if we failed
    if (this.listener) this.listener.destroy();
    this.reconnect = Promise.bind(this).delay(500).then(this.init);
  }

  _onData(data) {
    if (Twitter.isTweet(data)) {
      this.storage
        .insertStatus(Twitter.serializeTweet(data))
        .return(true);
    }
  }

  fetchTweets(cursor, account) {
    this.logger.debug('fetching tweets for %s based on max_id %s', account, cursor);
    const twitter = this.client;

    return Promise.fromCallback(next => twitter.get('statuses/user_timeline', {
      count: 200,
      screen_name: account,
      max_id: cursor,
      trim_user: false,
      exclude_replies: false,
      include_rts: true,
    }, next));
  }

  syncAccount(account) {
    const storage = this.storage;

    // recursively syncs account
    // TODO: subject to rate limit
    return this.storage.readStatuses({
      filter: {
        page: 0,
        account,
        pageSize: 1,
        order: 'asc',
      },
    })
    .bind(this)
    .spread(function fetchedTweets(tweet) {
      return this.fetchTweets(Twitter.cursor(tweet), account)
        .then((tweets) => {
          const length = tweets.length;
          this.logger.debug('fetched %d tweets', length);

          if (length === 0) {
            return null;
          }

          return Promise
            .bind(storage, tweets.map(Twitter.serializeTweet))
            .map(storage.insertStatus)
            .get(length - 1)
            .bind(this)
            .then(fetchedTweets);
        });
    });
  }

  fillUserIds(original) {
    return Promise
      .fromCallback((next) => {
        const screenNames = original
          .filter(element => (element.id === undefined))
          .map(element => (element.username))
          .join(',');

        if (screenNames === '') {
          next(null, []);
        } else {
          this.client.get('users/lookup', { screen_name: screenNames }, next);
        }
      })
      .reduce((acc, value) => {
        acc.push({ id: value.id_str, username: value.screen_name });
        return acc;
      }, [])
      .then(accounts => (merge(original, accounts)));
  }
}

// isTweet checker
Twitter.isTweet = conforms({
  entities: isObject,
  id_str: isString,
  text: isString,
});

// static helpers
Twitter.one = new BN('1', 10);

// cursor extractor
Twitter.cursor = (tweet) => {
  const cursor = tweet && (tweet.id || tweet.id_str);

  // no tweet / cursor
  if (!cursor) {
    return undefined;
  }

  return new BN(cursor, 10).sub(Twitter.one).toString(10);
};

Twitter.serializeTweet = (data, noSerialize) => {
  const tweet = {
    id: data.id_str,
    date: data.created_at,
    text: data.text,
  };

  const meta = {
    id_str: data.id_str,
    account: data.user.screen_name,
    account_id: data.user.id_str,
    entities: data.entities,
    retweeted: data.retweeted || false,
    retweeted_status: data.retweeted && Twitter.serializeTweet(data.retweeted_status, true),
  };

  tweet.meta = noSerialize !== true
    ? JSON.stringify(meta)
    : meta;

  return tweet;
};

module.exports = Twitter;
