const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const get = require('get-value');
const pLimit = require('p-limit');
const uuid = require('uuid/v4');
const { HttpStatusError } = require('common-errors');
const {
  isObject, isString, conforms, merge, find, isNil,
} = require('lodash');

const Notifier = require('./notifier');
const { transform, TYPE_TWEET } = require('../utils/response');


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

function twitterApiConfig(config) {
  const TWITTER_API_DEFAULTS = {
    // Refer to https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline
    user_timeline: {
      exclude_replies: false,
      include_rts: true,
    },
  };
  return merge(TWITTER_API_DEFAULTS, config.api);
}

function streamFilterOptions(config) {
  const STREAM_FILTERS_DEFAULTS = {
    replies: false,
    retweets: false,
  };
  return merge({}, STREAM_FILTERS_DEFAULTS, config.stream_filters);
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

  static isRetweet = (data) => {
    const retweet = data.retweeted_status;
    if (isNil(retweet)) {
      return false;
    }
    const tweetOwnerId = get(retweet, 'user.id');
    // Keep the tweets which are retweeted by the user
    return tweetOwnerId !== data.user.id;
  }

  static isReply = (data) => {
    const toUserId = data.in_reply_to_user_id;
    if (isNil(toUserId)) {
      return false;
    }
    // Keep the tweets which are replied by the user
    if (toUserId === get(data, 'user.id')) {
      return false;
    }

    // reply to status
    if (!isNil(data.in_reply_to_status_id)) {
      return true;
    }
    // reply by mention using @screen_name
    const mentions = get(data, 'entities.user_mentions', false);
    return Array.isArray(mentions) && mentions.length > 0;
  }


  static tweetFilterFactory(filterOptions) {
    const { replies, retweets, skipValidAccounts } = filterOptions;

    if (!replies && !retweets) {
      return () => false;
    }

    return (data, accountsIds = {}) => {
      if (skipValidAccounts) {
        const id = get(data, 'user.id');
        if (accountsIds[id] !== undefined) {
          // Don't filter tweets based by accounts whitelist
          return false;
        }
      }

      if (replies && Twitter.isReply(data)) {
        return true;
      }

      if (retweets && Twitter.isRetweet(data)) {
        return true;
      }
      return false;
    };
  }

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
      account: data.user.screen_name.toLowerCase(),
    };

    const meta = {
      id_str: data.id_str,
      account: data.user.screen_name,
      account_id: data.user.id_str,
      account_image: data.user.profile_image_url_https,
      entities: data.entities,
      extended_entities: data.extended_entities,
      retweeted_status: data.retweeted_status && Twitter.serializeTweet(data.retweeted_status, true),
    };

    tweet.meta = noSerialize !== true
      ? JSON.stringify(meta)
      : meta;

    return tweet;
  }

  static tweetFetcherFactory(twitter, logger, apiConfig) {
    const limit = pLimit(1);
    const fetch = (cursor, account, cursorField = 'max_id') => Promise.fromCallback((next) => (
      twitter.get('statuses/user_timeline', {
        count: 200,
        screen_name: account,
        trim_user: false,
        ...apiConfig.user_timeline,
        [cursorField]: cursor,
      }, (err, tweets, response) => {
        if (err) {
          if (response) {
            err.headers = response.headers;
            err.statusCode = response.statusCode;
          }

          return next(err);
        }
        return next(null, tweets);
      })
    ));

    return (cursor, account, cursorField = 'max_id') => {
      const time = process.hrtime();
      const quid = uuid();
      logger.debug('%s => queueing at %s', quid, time);
      return limit(async () => {
        logger.debug('fetching tweets for %s based on %s %s', account, cursorField, cursor);
        logger.debug('%s => starting to fetch tweets: %s', quid, process.hrtime(time));
        try {
          return await fetch(cursor, account, cursorField);
        } catch (err) {
          if (err.statusCode === 429) {
            const reset = err.headers['x-rate-limit-reset'] * 1000;
            logger.warn('Rate limit exceeded and would be refreshed at %s', new Date(reset));
            await Promise.delay(reset - Date.now());
            // make one more attempt while holding the same limit
            return await fetch(cursor, account, cursorField);
          }
          logger.warn('fetching for %s failed with %d: %s', account, err.statusCode, err.message);
          throw err;
        } finally {
          logger.debug('%s => got response: %s', quid, process.hrtime(time));
        }
      });
    };
  }

  /**
   * @param {Social} core
   * @param {object} config
   * @param {StorageService} storage
   * @param {Logger} logger
   */
  constructor(core, config, storage, logger) {
    this.core = core;
    this.client = new TwitterClient(config);
    this.listener = null;

    this.storage = storage;
    this.logger = logger.child({ namespace: '@social/twitter' });
    this._destroyed = false;
    this.following = [];
    this.accountIds = {};

    this.fetchTweets = Twitter.tweetFetcherFactory(this.client, this.logger, twitterApiConfig(config));
    this.filterTweets = Twitter.tweetFilterFactory(streamFilterOptions(config));

    // cheaper than bind
    this.onData = (json) => this._onData(json);
    this.onError = (err) => this._onError(err);
    this.onEnd = () => this._onEnd();
  }

  async init() {
    /* draining */
    if (this._destroyed) return;

    this.reconnect = null;

    try {
      const accounts = await this.storage
        .feeds()
        .fetch({ network: 'twitter' });

      const validAccounts = await Promise
        .reduce(accounts, extractAccount, [])
        .filter(async (twAccount) => {
          try {
            await this.syncAccount(twAccount.account, 'desc');
          } catch (exception) {
            const isAccountInaccessible = exception.statusCode === 401
              || (Array.isArray(exception) && exception.find((it) => (it.code === 34)));

            // removed twitter account
            if (isAccountInaccessible) {
              this.logger.warn('removing tw %j from database', twAccount);
              await this.storage.feeds().remove({
                internal: twAccount.internal,
                network: 'twitter',
                network_id: twAccount.network_id,
              });
              return false;
            }

            // augment with the account data
            exception.account = twAccount;
            this.logger.fatal({ err: exception }, 'unknown error from twitter');
            throw exception;
          }

          return true;
        }, { concurrency: 2 }); /* to avoid rate limits */

      this.listen(validAccounts);
    } catch (e) {
      this.onError(e);
    }
  }

  setFollowing(accounts) {
    this.following = accounts && accounts.length > 0
      ? accounts.map((it) => it.account)
      : [];
  }

  fillAccountIds(accounts = []) {
    this.accountIds = accounts.reduce(
      (map, it) => ({ ...map, [it.account_id]: true }),
      {}
    );
    Object.setPrototypeOf(this.accountIds, null);
  }

  listen(accounts) {
    const params = {};
    if (accounts.length > 0) {
      params.follow = accounts
        .map((twAccount) => twAccount.account_id)
        .join(',');

      this.setFollowing(accounts);
      this.fillAccountIds(accounts);
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
    if (this.timeout) {
      // reset old timeout
      this.timeout.refresh();
    } else {
      // set new timeout
      this.timeout = setTimeout(() => {
        this.listener.emit('error', new Error('timed out, no data in 90 seconds'));
      }, 90000);
    }
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
    if (Array.isArray(exception) && exception.find((it) => (it.code === 34))) {
      // do not reconnect, but try to identify account that has been deleted
      this.logger.warn('account erased from', exception);
    } else if (exception.message === 'Status Code: 420') {
      this.destroy();
      this.logger.warn('stream connection rate limit, reconnect in 10s', exception.message);
      this.reconnect = Promise.bind(this).delay(10000).then(this.init);
    } else {
      this.logger.error({ err: exception }, 'stream connection failed');
      this._destroyAndReconnect();
    }
  }

  _onEnd() {
    this.logger.warn('stream connection closed', this.listener && this.listener.params);
    this._destroyAndReconnect();
  }

  async _onData(data) {
    if (Twitter.isTweet(data)) {
      if (this.filterTweets(data, this.validAccounts)) {
        return false;
      }
      this.logger.debug({ data }, 'inserting tweet');
      try {
        const tweet = Twitter.serializeTweet(data);
        const saved = await this.storage
          .twitterStatuses()
          .save(tweet);
        this.publish(saved);
        return saved;
      } catch (err) {
        this.logger.warn({ err }, 'failed to save tweet');
      }
    }

    return false;
  }

  publish = (tweet) => {
    const account = get(tweet, 'meta.account', false);
    const { following } = this;
    if (account && Array.isArray(following) && following.includes(account)) {
      const route = `twitter/subscription/${account}`;
      const payload = transform(tweet, TYPE_TWEET);
      this.core.emit(Notifier.kPublishEvent, route, payload);
    }
  }

  async syncAccount(account, order = 'asc', maxPages = 20) {
    const twitterStatuses = this.storage.twitterStatuses();
    const fetchedTweets = async (tweet, page = 1) => {
      const tweets = await this.fetchTweets(
        Twitter.cursor(tweet, order),
        account,
        order === 'asc' ? 'max_id' : 'since_id'
      );

      const { length } = tweets;
      this.logger.debug('fetched %d tweets', length);

      if (length === 0 || page >= maxPages) {
        return;
      }

      const index = order === 'asc' ? length - 1 : 0;
      const oldestTweet = await Promise
        .map(tweets, this.onData)
        .get(index); // TODO: ensure that we are picking a tweet

      await fetchedTweets(oldestTweet, page + 1);
    };

    // recursively syncs account
    const [initialTweet] = await twitterStatuses.list({
      filter: {
        page: 0,
        account,
        pageSize: 1,
        order,
      },
    });

    await fetchedTweets(initialTweet);
  }

  fillUserIds(original) {
    const screenNames = original
      .filter((element) => (element.id === undefined))
      .map((element) => (element.username))
      .join(',');

    return Promise
      .fromCallback((next) => {
        if (screenNames === '') {
          next(null, []);
        } else {
          this.client.get('users/lookup', { screen_name: screenNames }, next);
        }
      })
      .catch((e) => Array.isArray(e), (err) => {
        this.logger.warn({ err }, 'failed to lookup %j', screenNames);
        throw new HttpStatusError(400, JSON.stringify(err));
      })
      .reduce((acc, value) => {
        acc.push({ id: value.id_str, username: value.screen_name });
        return acc;
      }, [])
      .then((accounts) => (merge(original, accounts)));
  }
}

module.exports = Twitter;
