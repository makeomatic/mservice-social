const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const {
  isObject, isString, conforms, merge, find,
} = require('lodash');

function extractAccount(accum, value) {
  const accountId = value.meta.account_id;

  // if we have accountId & we dont have it yet
  if (accountId && !find(accum, { account_id: accountId })) {
    value.meta.internal = value.internal;
    value.meta.network_id = value.network_id;
    accum.push(value.meta);
  }

  return accum;
}

/**
 * @property {TwitterClient} client
 * @property {array} listeners
 * @property {Knex} knex
 * @property {Logger} logger
 */
class Twitter {
  /**
   *  static helpers
   */
  static one = new BN('1', 10)

  // isTweet checker
  static isTweet = conforms({
    entities: isObject,
    id_str: isString,
    text: isString,
  })

  /**
   * cursor extractor
   * @param {object} tweet
   * @param {string} order
   */
  static cursor(tweet, order = 'asc') {
    const cursor = tweet && (tweet.id || tweet.id_str);

    // no tweet / cursor
    if (!cursor) {
      return undefined;
    }

    if (order === 'desc') {
      return cursor;
    }

    return new BN(cursor, 10)
      .sub(Twitter.one)
      .toString(10);
  }

  /**
   * @param {object} data
   * @param {boolean} noSerialize
   */
  static serializeTweet(data, noSerialize) {
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
      retweeted_status: data.retweeted_status && Twitter.serializeTweet(data.retweeted_status, true),
    };

    tweet.meta = noSerialize !== true
      ? JSON.stringify(meta)
      : meta;

    return tweet;
  }

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
    this._destroyed = false;

    // cheaper than bind
    this.onData = json => this._onData(json);
    this.onError = err => this._onError(err);
    this.onEnd = () => this._onEnd();
  }

  init() {
    /* draining */
    if (this._destroyed) return null;

    this.reconnect = null;

    return this.storage
      .feeds()
      .fetch({ network: 'twitter' })
      .bind(this)
      .reduce(extractAccount, [])
      .filter(twAccount => (
        this
          .syncAccount(twAccount.account, 'desc')
          .return(true)
          .catch(async (exception) => {
            // removed twitter account
            if (Array.isArray(exception) && exception.find(it => (it.code === 34))) {
              this.logger.warn('removing tw %j from database', twAccount);
              await this.storage.feeds().remove({
                internal: twAccount.internal,
                network: 'twitter',
                network_id: twAccount.network_id,
              });
              return false;
            }

            this.logger.fatal('unknown error from twitter', exception);
            throw exception;
          })
      ), { concurrency: 2 }) /* to avoid rate limits */
      .then(this.listen)
      .catch(this.onError);
  }

  listen(accounts) {
    const params = {};
    if (accounts.length > 0) {
      params.follow = accounts
        .map(twAccount => twAccount.account_id)
        .join(',');
    }

    if (!params.follow) {
      return false;
    }

    // destroy old listener if we had it
    this.destroy();

    // setup new listener while old is still active
    const listener = this.listener = this.client.stream('statuses/filter', params);

    listener.on('data', this.onData);
    listener.on('error', this.onError);
    listener.on('end', this.onEnd);

    // attach params
    listener.params = params;

    // TODO: do this!
    // add 'delete' handler
    // listener.on('delete', this.onDelete);

    // remap stream receiver to add 90 sec timeout
    const { receive } = listener;
    listener.receive = (chunk) => {
      this.resetTimeout();
      receive.call(listener, chunk);
    };

    // init new reset timer
    this.resetTimeout();

    this.logger.info('Listening for %d accounts. Account list: %s', accounts.length, params.follow);
    return true;
  }

  resetTimeout() {
    // reset old timeout
    if (this.timeout) clearTimeout(this.timeout);

    // set new timeout
    this.timeout = setTimeout(() => {
      this.listener.emit('error', new Error('timed out, no data in 90 seconds'));
    }, 90000);
  }

  connect() {
    // schedule reconnect
    if (this.reconnect) {
      this.logger.warn('reconnect was scheduled, skipping...');
      return;
    }

    this.logger.warn('scheduled reconnect in 1000ms');
    this.reconnect = Promise.bind(this).delay(1000).then(this.init);
  }

  destroy(final = false) {
    // reconnect if we failed
    if (this.listener) {
      this.listener.removeAllListeners();
      this.listener.destroy();
      this.listener = null;
    }

    if (this.timeout) clearTimeout(this.timeout);
    if (this.reconnect) {
      this.reconnect.cancel();
      this.reconnect = null;
    }
    if (final) this._destroyed = true;
  }

  _destroyAndReconnect() {
    this.destroy();
    this.connect();
  }

  _onError(exception) {
    if (Array.isArray(exception) && exception.find(it => (it.code === 34))) {
      // do not reconnect, but try to identify account that has been deleted
      this.logger.warn('account erased from', exception);
    } else if (exception.message === 'Status Code: 420') {
      this.destroy();
      this.logger.warn('stream connection rate limit, reconnect in 10s', exception.message);
      this.reconnect = Promise.bind(this).delay(10000).then(this.init);
    } else {
      this.logger.error('stream connection failed', exception);
      this._destroyAndReconnect();
    }
  }

  _onEnd() {
    this.logger.warn('stream connection closed', this.listener && this.listener.params);
    this._destroyAndReconnect();
  }

  _onData(data) {
    if (Twitter.isTweet(data)) {
      this.logger.debug('inserting tweet', data);
      this.storage
        .twitterStatuses()
        .save(Twitter.serializeTweet(data))
        .return(true);
    }
  }

  fetchTweets(cursor, account, cursorField = 'max_id') {
    this.logger.debug('fetching tweets for %s based on %s %s', account, cursorField, cursor);
    const twitter = this.client;

    return Promise.fromCallback(next => twitter.get('statuses/user_timeline', {
      count: 200,
      screen_name: account,
      trim_user: false,
      exclude_replies: false,
      include_rts: true,
      [cursorField]: cursor,
    }, next));
  }

  syncAccount(account, order = 'asc') {
    const twitterStatuses = this.storage.twitterStatuses();

    // recursively syncs account
    // TODO: subject to rate limit
    return twitterStatuses
      .list({
        filter: {
          page: 0,
          account,
          pageSize: 1,
          order,
        },
      })
      .bind(this)
      .spread(function fetchedTweets(tweet) {
        return this
          .fetchTweets(
            Twitter.cursor(tweet, order),
            account,
            order === 'asc' ? 'max_id' : 'since_id'
          )
          .then((tweets) => {
            const { length } = tweets;
            this.logger.debug('fetched %d tweets', length);

            if (length === 0) {
              return null;
            }

            const index = order === 'asc' ? length - 1 : 0;
            return Promise
              .bind(twitterStatuses, tweets.map(Twitter.serializeTweet))
              .map(twitterStatuses.save)
              .get(index)
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

module.exports = Twitter;
