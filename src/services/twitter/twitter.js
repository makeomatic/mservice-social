const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const get = require('get-value');
const pLimit = require('p-limit');
const { v4: uuid } = require('uuid');
const { HttpStatusError } = require('common-errors');
const {
  isObject, isString, conforms, merge, find, isNil,
} = require('lodash');

const assert = require('assert');
const StatusFilter = require('./status-filter');
const { transform, TYPE_TWEET } = require('../../utils/response');
const { getTweetType, TweetTypeByName } = require('./tweet-types');

const EXTENDED_TWEET_MODE = {
  tweet_mode: 'extended',
};
const { kPublishEvent } = require('../notifier');
const nitter = require('./nitter/nitter');

const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '2500', 10);

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

// function twitterApiConfig(config) {
//   const TWITTER_API_DEFAULTS = {
//     // Refer to https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline
//     user_timeline: {
//       exclude_replies: false,
//       include_rts: true,
//     },
//   };
//   return merge(TWITTER_API_DEFAULTS, config.api);
// }

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
  static one = new BN('1', 10);

  // isTweet checker
  static isTweet = conforms({
    entities: isObject,
    id_str: isString,
    text: isString,
  });

  static isRetweet = (data) => {
    const retweet = data.retweeted_status;
    if (isNil(retweet)) {
      return false;
    }
    const tweetOwnerId = get(retweet, 'user.id');
    // Keep the tweets which are retweeted by the user
    return tweetOwnerId !== data.user.id;
  };

  static isReply = (data) => {
    const toUserId = data.in_reply_to_user_id;
    if (isNil(toUserId)) {
      return false;
    }
    // Keep the tweets which are replied by the user
    if (toUserId === data.user.id) {
      return false;
    }
    return !isNil(data.in_reply_to_status_id);
  };

  /**
   * cursor extractor
   * @param {object} tweet
   * @param {string} order
   */
  static cursor(tweet, order = 'asc') {
    const cursor = tweet?.id_str || tweet?.id;

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

    this.notifyConfig = config.notifications;
    this.requestsConfig = config.requests;
    this.storage = storage;

    this.logger = logger.child({ namespace: '@social/twitter' });

    const { restrictedTypes = [] } = config.requests || {};
    this.restrictedStatusTypes = restrictedTypes.map((name) => TweetTypeByName[name]);
    this.logger.info({ types: this.restrictedStatusTypes }, 'request tweet restrictions');

    this.statusFilter = new StatusFilter(config.stream_filters, this.logger);

    this.following = [];
    this.accountIds = {};
    this.syncPromise = null;
    this.resyncTimer = null;

    // this.fetchTweets = Twitter.tweetFetcherFactory(this.client, this.logger, twitterApiConfig(config));
    // this.fetchById = Twitter.tweetSyncFactory(this.client, this.logger);
    this.fetchTweets = nitter.fetchTweets;
    this.fetchById = nitter.fetchById;

    // cheaper than bind
    this.onData = (notify) => (json) => this._onData(json, notify);
    this.init = this.init.bind(this);
  }

  requestRestrictedTypes() {
    return this.restrictedStatusTypes;
  }

  async init() {
    if (this.resyncTimer) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
    }

    try {
      this.syncPromise = Promise
        .resolve()
        .then(async () => {
          const accounts = await this.storage
            .feeds()
            .fetch({ network: 'twitter' });

          return Promise
            .reduce(accounts, extractAccount, [])
            .filter(async (twAccount) => {
              try {
                await this.syncAccount(twAccount, 'desc');
              } catch (exception) {
                const isAccountInaccessible = exception.statusCode === 401
                  || (Array.isArray(exception) && exception.find((it) => (it.code === 34)));

                // removed twitter account
                if (isAccountInaccessible) {
                  this.logger.warn({ twAccount }, 'removing tw from database');
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
              /* to avoid rate limits */
            }, { concurrency: 50 });
        });

      const validAccounts = await this.syncPromise;

      this.logger.info({ validAccounts }, 'resolved accounts');

      // TODO: no need to re-do this every sync cycle
      this.setFollowing(validAccounts);
      this.fillAccountIds(validAccounts);

      this.resyncTimer = setTimeout(this.init, SYNC_INTERVAL);
    } catch (err) {
      if (this.syncPromise && !this.syncPromise.isCancelled) {
        this.logger.warn({ err }, 'error syncing accounts');
        this.resyncTimer = setTimeout(this.init, SYNC_INTERVAL);
        this.syncPromise = null;
      } else {
        this.logger.warn({ err }, 'sync promise cancelled');
      }
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

  async connect() {
    // schedule reconnect
    if (this.resyncTimer) {
      this.logger.warn('reconnect was scheduled, skipping...');
      return;
    }

    if (!this.syncPromise) {
      await this.init();
    }
  }

  destroy() {
    if (this.syncPromise) {
      this.syncPromise.cancel();
    }

    if (this.resyncTimer) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
    }
  }

  shouldNotifyFor(event, from) {
    const allow = this.notifyConfig[event];

    return Array.isArray(allow) && allow.includes(from);
  }

  shouldFilterTweet(data, tweetType) {
    return this.statusFilter.apply(data, tweetType, this.accountIds);
  }

  async _saveToStatuses(data, tweetType, directlyInserted, logger) {
    const tweet = Twitter.serializeTweet(data);

    const status = { ...tweet, type: tweetType };

    if (directlyInserted) {
      status.explicit = true;
    }
    logger.debug({ status, tweet, data }, 'saving serialized status');

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
        this.logger.debug({ id: data.id_str, type: tweetType, user: data.user.screen_name }, 'tweet skipped by type filter');
        await this._saveCursor(data);

        return false;
      }

      this.logger.debug({ id: data.id_str, type: tweetType, user: data.user.screen_name }, 'inserting tweet');
      this.logger.trace({ data }, 'inserting tweet data');
      try {
        const saved = await this._saveToStatuses(data, tweetType, false, this.logger);
        await this._saveCursor(data);

        if (notify) {
          this.publish(saved);
        }

        return saved;
      } catch (err) {
        this.logger.warn({ data, err }, 'failed to save tweet');
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
      this.core.emit(kPublishEvent, route, payload);
    } else {
      this.logger.warn({ tweet, account, following }, 'skipped broadcast');
    }
  }

  async syncTweet(tweetId) {
    try {
      const data = await this.fetchById(tweetId);

      this.logger.debug({ data }, 'tweet fetchById');

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

  async syncAccount({ account }, order = 'asc', maxPages = 20) {
    const twitterStatuses = this.storage.twitterStatuses();
    // calculate notification on sync
    const notify = this.shouldNotifyFor('data', 'sync');

    const loader = async (lastKnownTweet) => {
      let looped = true;
      let pages = 1;
      let count = 0;
      let cursor = null;

      while (looped) {
        // eslint-disable-next-line no-await-in-loop
        const { tweets, cursorTop, cursorBottom } = await nitter.fetchTweets(cursor, account, order);

        assert(cursorTop);
        assert(cursorBottom);
        assert(tweets !== null);

        if (lastKnownTweet) {
          for (const tweet of tweets) {
            if (lastKnownTweet.id_str === tweet.id_str) {
              looped = false;
              break;
            }
          }
        }

        const store = this.onData(notify);
        for (const tweet of tweets) {
          // eslint-disable-next-line no-await-in-loop
          await store(tweet);
        }
        // await Promise.map(tweets, this.onData(notify));

        looped = looped && pages < maxPages && tweets.length > 0;
        cursor = cursorBottom;
        count += tweets.length;
        if (looped) {
          pages += 1;
        }

        this.logger.debug({
          looped, pages, cursor, count, account,
        }, 'tweet loader');
      }
    };

    // recursively syncs account
    const [lastKnownTweet] = await twitterStatuses.list({
      filter: {
        page: 0,
        account,
        pageSize: 1,
        order,
      },
    });

    this.logger.info({ lastKnownTweet: { id_str: lastKnownTweet?.id_str, id: lastKnownTweet?.id }, account }, 'selected last tweet from account');
    // await fetchedTweets(initialTweet);
    await loader(lastKnownTweet);
  }

  // eslint-disable-next-line class-methods-use-this
  async fillUserIds(original) {
    const screenNames = original
      .filter((element) => (element.id === undefined))
      .map((element) => (element.username));

    const accounts = [];
    for (const _username of screenNames) {
      // eslint-disable-next-line no-await-in-loop
      const { id, username } = await nitter.fetchUserId(_username);
      accounts.push({ id, username });
    }

    return merge(original, accounts);
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
