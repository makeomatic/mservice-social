const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const get = require('get-value');
const pLimit = require('p-limit');
const uuid = require('uuid/v4');
const fp = require('lodash/fp');
const { HttpStatusError } = require('common-errors');
const {
  isObject, isString, conforms, merge, find, isNil, pick, compact,
} = require('lodash');

const Notifier = require('./notifier');
const { transform, TYPE_TWEET } = require('../utils/response');

const kReplies = 'replies';
const kRetweets = 'retweets';
const kIgnoreForFollowed = 'ingoreForFollowed';
const kNotTweetError = new Error('not a tweet');

// ['mls', 'twitter'] => { mls: true, twitter: true }
const setFollowedAccounts = fp.reduce(fp.flip(fp.partial(fp.assoc, [fp.__, true])), {});
const shouldFilterReplies = fp.matches({ [kReplies]: true });
const shouldFilterRetweets = fp.matches({ [kRetweets]: true });
const shouldSkipValid = fp.matches({ [kIgnoreForFollowed]: true });
const toSnakeCaseKeys = fp.compose(
  fp.reduce((acc, key, value) => ({ ...acc, [fp.snakeCase(key)]: value }), {}),
  Object.entries
);

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
  // is required to ensure if we actually received a tweet, but not an error or something similar
  // https://developer.twitter.com/en/docs/twitter-api/v1/tweets/filter-realtime/overview
  static isTweet = conforms({
    entities: isObject,
    id_str: isString,
    text: isString,
  })

  static ensureIsTweet = fp.compose(
    (isTweet) => {
      if (isTweet === false) {
        throw kNotTweetError;
      }
      return true;
    },
    Twitter.isTweet
  )

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

    return !isNil(data.in_reply_to_screen_name);
  }

  static isFollowedAccount = (accounts, idStr) => {
    return accounts[idStr] === true;
  }

  static getFilterConditions(following) {
    return [
      [shouldSkipValid, fp.partial(Twitter.isFollowedAccount, following)],
      [shouldFilterReplies, Twitter.isReply],
      [shouldFilterRetweets, Twitter.isRetweet],
      [fp.stubFalse],
    ];
  }

  static conditionOrNull(filterOptions, [predicate, condition]) {
    return predicate(filterOptions) ? condition : null;
  }

  static applyFilter(data, filter) {
    return filter(data);
  }

  static getStreamFilters(following = {}) {
    const conditions = Twitter.getFilterConditions(following);
    return fp.compose(
      // Array<condition || null> => condition[]
      fp.compact,
      // iterator, filterOptions => Array<condition || null>
      fp.partial(fp.map, [fp.__, conditions]),
      // filterOptions => iterator: ([ predicate, condition ]) => condition || null
      fp.curry(Twitter.conditionOrNull)
    );
  }

  static getAppliedStreamFilters(filters) {
    return fp.compose(
      // tweet => boolean
      fp.partial(fp.find, [fp.__, filters]),
      // iterator:: tweet => boolean
      fp.curry(Twitter.applyFilter)
    );
  }

  static getTweetId = (tweet) => tweet && (tweet.id || tweet.id_str);

  static getOldestTweet = (order = 'asc') => {
    const lookup = order === 'asc' ? fp.findLast : fp.find;
    return lookup(Twitter.getTweetId);
  }

  /**
   * cursor extractor
   * @param {object} tweet
   * @param {string} order
   */
  static cursor(tweet, order = 'asc') {
    const cursor = Twitter.getTweetId(tweet);

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
    logger.debug('initialize fetch with %j options', apiConfig);

    const limit = pLimit(1);
    const fetch = (cursor, account, cursorField = 'max_id') => Promise.fromCallback((next) => (
      twitter.get('statuses/user_timeline', {
        count: 200,
        screen_name: account,
        trim_user: false,
        include_rts: apiConfig.userTimeline.includeRts,
        exclude_replies: apiConfig.userTimeline.excludeReplies,
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

  static getServiceConfig(logger, config) {
    // check for deprecated fields
    const snakeCasedFields = Object.keys(config).filter((it) => it.includes('_'));
    for (const field of snakeCasedFields) {
      logger.warn(`DEPRECATED: ${field}, provide it via twitter.client`);
    }

    return {
      apis: config.apis,
      client: config.client || pick(config, snakeCasedFields),
      notificationPolicy: config.notificationPolicy,
      streamFilters: config.streamFilters,
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
    this.logger = logger.child({ namespace: '@social/twitter' });
    this.config = Twitter.getServiceConfig(this.logger, config);
    this.client = new TwitterClient(toSnakeCaseKeys(this.config.client));
    this.listener = null;

    this.storage = storage;
    this._destroyed = false;
    this.following = {};

    this.fetchTweets = Twitter.tweetFetcherFactory(
      this.client,
      this.logger,
      this.config.apis
    );

    // init stream filter
    this.setStreamFilter();

    // cheaper than bind
    this.setSyncDataHandler();
    this.setStreamDataHandler();
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

  setFollowing(accounts = []) {
    this.following = setFollowedAccounts(accounts);
    Object.setPrototypeOf(this.following, null);
  }

  setStreamFilter() {
    const builder = Twitter.getStreamFilters(this.following);
    const filters = builder(this.config.streamFilters);
    this.filter = Twitter.getAppliedStreamFilters(filters);
  }

  setStreamDataHandler() {
    this.onStreamData = this.setupDataHandler(true);
  }

  setSyncDataHandler() {
    this.onData = this.setupDataHandler(false);
  }

  listen(accounts) {
    const params = {};
    if (accounts.length > 0) {
      params.follow = accounts
        .map((twAccount) => twAccount.account_id)
        .join(',');

      this.setFollowing(accounts);
      this.setStreamFilter();
      this.setStreamDataHandler();
      this.logger.info('following these accounts: %s', accounts.join(', '));
    }

    if (!params.follow) {
      return false;
    }

    // destroy old listener if we had it
    this.destroy();

    // setup new listener while old is still active
    const listener = this.listener = this.client.stream('statuses/filter', params);

    listener.on('data', this.onStreamData);
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

  publish = (tweet) => {
    const account = get(tweet, 'meta.account', false);

    if (this.shouldPublish(tweet)) {
      return;
    }

    if (account && this.following[account] === true) {
      const route = `twitter/subscription/${account}`;
      const payload = transform(tweet, TYPE_TWEET);
      this.core.emit(Notifier.kPublishEvent, route, payload);
    }
  }

  shouldPublish = (tweet) => {
    try {
      const createdAt = get(tweet, 'created_at', false);

      if (createdAt === false) {
        return false;
      }

      const now = Date.now();
      const then = new Date(createdAt);
      return now - then <= this.config.notificationPolicy.limitMaxAgeMs;
    } catch (err) {
      this.logger.debug({ err, tweet }, 'cannot decide if I should publish that');
      return false;
    }
  }

  setupDataHandler = (useFilter = false) => {
    const pipe = compact([
      // force-check if data is a tweet
      fp.tap(Twitter.ensureIsTweet),
      // apply extra filters if it is required
      useFilter ? this.filter : null,
      // store the tweet
      this.insertTweet,
      // notify subscribers if it is required
      this.config.notificationPolicy.limitMaxAgeMs > 0 ? fp.tap(this.publish) : null,
    ]);

    return fp.pipe(...pipe);
  }

  insertTweet = async (data) => {
    this.logger.debug({ data }, 'inserting tweet');
    try {
      const tweet = Twitter.serializeTweet(data);
      const saved = await this.storage
        .twitterStatuses()
        .save(tweet);

      return saved;
    } catch (err) {
      this.logger.warn({ err }, 'failed to save tweet');
      throw err;
    }
  }

  async syncAccount(account, order = 'asc', maxPages = 20) {
    const getOldestTweet = Twitter.getOldestTweet(order);
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
        this.logger.info('account [%s] synced', account);
        return;
      }

      const results = await Promise
        .map(tweets, this.onData);
      const oldestTweet = getOldestTweet(results);

      if (!oldestTweet) {
        this.logger.info('no tweets saved, account [%s] seems to be synced', account);
        this.logger.debug('searched among %d records', results.length);
        this.logger.debug({ results }, 'records itself');
        return;
      }

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
