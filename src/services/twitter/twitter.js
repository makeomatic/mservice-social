const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const get = require('get-value');
const pLimit = require('p-limit');
const { v4: uuid } = require('uuid');
const { HttpStatusError } = require('common-errors');
const {
  isObject, isString, conforms, merge, find,
} = require('lodash');

const Notifier = require('../notifier');
const { transform, TYPE_TWEET } = require('../../utils/response');
const StatusFilter = require('./status-filter');
const { getTweetType } = require('./tweet-types');

const EXTENDED_TWEET_MODE = {
  tweet_mode: 'extended',
};

function extractAccount(accum, value) {
  const accountId = value.meta.account_id;

  // if we have accountId & we dont have it yet
  if (accountId && !find(accum, { account_id: accountId })) {
    value.meta.internal = value.internal;
    value.meta.network_id = value.network_id;
    value.meta.cursor = value.cursor;
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

/**
 * @property {TwitterClient} client
 * @property {array} listeners
 * @property {Knex} knex
 * @property {Logger} logger
 */
class Twitter {
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
    // console.log('tweet to serialize: %j', data);

    const tweet = {
      id: data.id_str,
      date: data.created_at,
      text: data.full_text || (data.extended_tweet ? data.extended_tweet.full_text : data.text),
      account: data.user.screen_name.toLowerCase(),
    };

    const meta = {
      id_str: data.id_str,
      account: data.user.screen_name,
      account_id: data.user.id_str,
      account_image: data.user.profile_image_url_https,
      account_name: data.user.name,
      account_verified: data.user.verified,
      entities: data.entities,
      extended_entities: data.extended_entities,
      retweeted_status: data.retweeted_status && Twitter.serializeTweet(data.retweeted_status, true),
      quoted_status: data.quoted_status && Twitter.serializeTweet(data.quoted_status, true),
      retweet_count: data.retweet_count,
      favorite_count: data.favorite_count,
    };

    tweet.meta = noSerialize !== true
      ? JSON.stringify(meta)
      : meta;

    return tweet;
  }

  static tweetSyncFactory(twitter, logger) {
    // https://developer.twitter.com/en/docs/twitter-api/v1/tweets/post-and-engage/api-reference/get-statuses-show-id
    const fetch = (id) => Promise.fromCallback((next) => (
      twitter.get('statuses/show', {
        ...EXTENDED_TWEET_MODE,
        id,
      }, (err, tweet) => {
        if (err) {
          return next(err);
        }
        return next(null, tweet);
      })
    ));

    return async (tweetId) => {
      logger.debug({ tweetId }, 'fetching tweet by id');
      const tweet = await fetch(tweetId);
      return tweet;
    };
  }

  static tweetFetcherFactory(twitter, logger, apiConfig) {
    logger.debug('timeline config: %j', apiConfig.user_timeline);
    const limit = pLimit(1);
    const fetch = (cursor, account, cursorField = 'max_id') => Promise.fromCallback((next) => (
      twitter.get('statuses/user_timeline', {
        ...EXTENDED_TWEET_MODE,
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

    this.notifyConfig = config.notifications;
    this.storage = storage;
    this.logger = logger.child({ namespace: '@social/twitter' });
    this.statusFilter = new StatusFilter(config.stream_filters, this.logger);

    this._destroyed = false;
    this.following = [];
    this.accountIds = {};

    this.fetchTweets = Twitter.tweetFetcherFactory(this.client, this.logger, twitterApiConfig(config));
    this.fetchById = Twitter.tweetSyncFactory(this.client, this.logger);

    // cheaper than bind
    this.onData = (notify) => (json) => this._onData(json, notify);
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
            await this.syncAccount(twAccount, 'desc');
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
    const params = {
      ...EXTENDED_TWEET_MODE,
    };
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

    // calculate notification on init
    const notify = this.shouldNotifyFor('data', 'init');

    listener.on('data', this.onData(notify));
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
      this.listener.on('error', () => { /* ignore */ });
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

  shouldNotifyFor(event, from) {
    const allow = this.notifyConfig[event];

    return Array.isArray(allow) && allow.includes(from);
  }

  shouldFilterTweet(data, tweetType) {
    return this.statusFilter.apply(data, tweetType);
  }

  async _saveToStatuses(data, tweetType, directlyInserted, logger) {
    const tweet = Twitter.serializeTweet(data);

    const status = { ...tweet, type: tweetType };

    if (directlyInserted) {
      status.explicit = true;
    }
    logger.trace({ status }, 'saving serialized status');

    return this.storage
      .twitterStatuses()
      .save(status);
  }

  async _saveCursor(data) {
    const tweet = Twitter.serializeTweet(data, true);

    return this.storage
      .feeds()
      .saveCursor(tweet.id, tweet.meta.account_id, 'twitter');
  }

  async _getCursor(account) {
    return this.storage
      .feeds()
      .getCursor(account, 'twitter');
  }

  async _onData(data, notify = true) {
    if (Twitter.isTweet(data)) {
      const tweetType = getTweetType(data);

      if (this.shouldFilterTweet(data, tweetType) !== false) {
        this.logger.debug({ id: data.id, type: tweetType, user: data.user.screen_name }, 'filtered: save cursor');
        await this._saveCursor(data);

        return false;
      }

      this.logger.debug({ id: data.id, type: tweetType, user: data.user.screen_name }, 'inserting tweet');
      this.logger.trace({ data }, 'inserting tweet data');
      try {
        const saved = await this._saveToStatuses(data, tweetType, false, this.logger);
        this.logger.trace({ id: data.id }, 'tweet status inserted');

        await this._saveCursor(data);
        this.logger.trace({ id: data.id }, 'tweet cursor saved');

        if (notify) {
          this.publish(saved);
          this.logger.trace({ id: data.id }, 'notified');
        }
        return saved;
      } catch (err) {
        this.logger.warn({ id: data.id, err }, 'failed to save tweet');
      }
    }

    return false;
  }

  publish(tweet) {
    const account = get(tweet, 'meta.account', false);
    const { following } = this;
    if (account && Array.isArray(following) && following.includes(account)) {
      const route = `twitter/subscription/${account}`;
      const payload = transform(tweet, TYPE_TWEET);
      this.core.emit(Notifier.kPublishEvent, route, payload);
    }
  }

  async syncTweet(tweetId) {
    try {
      const data = await this.fetchById(tweetId);
      if (Twitter.isTweet(data)) {
        // inserted directly using api/sync
        const tweetType = getTweetType(data);
        const saved = await this._saveToStatuses(data, tweetType, true, this.logger);
        this.logger.debug({ tweetId }, 'tweet synced');
        return saved;
      }

      return false;
    } catch (err) {
      this.logger.warn({ tweetId, err }, 'failed to sync tweet');
      throw new HttpStatusError(400, JSON.stringify(err));
    }
  }

  async syncAccount({ cursor, account }, order = 'asc', maxPages = 20) {
    const twitterStatuses = this.storage.twitterStatuses();
    // calculate notification on sync
    const notify = this.shouldNotifyFor('data', 'sync');

    const fetchedTweets = async (tweet, page = 1) => {
      const tweets = await this.fetchTweets(
        cursor || Twitter.cursor(tweet, order),
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
        .map(tweets, this.onData(notify))
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
      .map((element) => (element.username));

    const usersParams = screenNames.join(',');

    const validateAccounts = (userNames, accounts) => {
      for (const username of userNames) {
        const account = find(accounts, (x) => x.username.toLowerCase() === username.toLowerCase());
        if (account === undefined) {
          throw new HttpStatusError(400, `Users lookup failed for '${username}'`);
        }
      }
      return true;
    };

    return Promise
      .fromCallback((next) => {
        if (screenNames === '') {
          next(null, []);
        } else {
          this.client.get('users/lookup', { screen_name: usersParams }, next);
        }
      })
      .catch((e) => Array.isArray(e), (err) => {
        this.logger.warn({ err }, 'failed to lookup %j', usersParams);
        throw new HttpStatusError(400, JSON.stringify(err));
      })
      .reduce((acc, value) => {
        acc.push({ id: value.id_str, username: value.screen_name });
        return acc;
      }, [])
      .then((accounts) => {
        validateAccounts(screenNames, accounts);

        return merge(original, accounts);
      });
  }
}

/**
 *  static helpers
 */
Twitter.one = new BN('1', 10);

// isTweet checker
Twitter.isTweet = conforms({
  entities: isObject,
  id_str: isString,
  // TODO text or full_text: isString,
});

module.exports = Twitter;
