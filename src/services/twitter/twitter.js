const get = require('get-value');
const { HttpStatusError } = require('common-errors');
const { merge, find } = require('lodash');
const hwp = require('hwp');

const StatusFilter = require('./status-filter');
const { transform, TYPE_TWEET } = require('../../utils/response');
const { getTweetType, TweetTypeByName, isTweet } = require('./tweet-types');

const { kPublishEvent } = require('../notifier');
const { NitterClient } = require('./nitter/nitter-client');

const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || '2500', 10);

function extractAccount(accum, value) {
  const accountId = value.meta.account_id;

  // if we have accountId & we dont have it yet
  if (accountId && !find(accum, { account_id: accountId })) {
    value.meta.internal = value.internal;
    value.meta.network_id = value.network_id;
    value.meta.cursor = value.cursor;
    value.meta.account = value.meta.account.toLowerCase();
    accum.push(value.meta);
  }

  return accum;
}

/**
 * @property {array} listeners
 * @property {Knex} knex
 * @property {Logger} logger
 */
class Twitter {
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

  /**
   * @param {Social} core
   * @param {object} config
   * @param {StorageService} storage
   * @param {Logger} logger
   */
  constructor(core, config, storage, logger) {
    this.core = core;
    this.syncOnStart = config.syncOnStart;
    this.loaderMaxPages = config.max_pages ?? 20;
    this.isStopped = false;
    this.notifyConfig = config.notifications;
    this.storage = storage;
    this.nitter = new NitterClient({
      logger: logger.child({ namespace: '@social/nitter' }),
    });
    this.logger = logger.child({ namespace: '@social/twitter' });
    this.loaders = new Map();

    const { restrictedTypes = [] } = config.requests || {};
    this.restrictedStatusTypes = restrictedTypes.map((name) => TweetTypeByName[name]);
    this.logger.info({ types: this.restrictedStatusTypes }, 'request tweet restrictions');

    this.statusFilter = new StatusFilter(config.stream_filters, this.logger);

    this.following = [];
    this.accountIds = {};
    this.syncTimer = null;

    this.syncFeed = this.syncFeed.bind(this);
    this.init = this.init.bind(this);
  }

  requestRestrictedTypes() {
    return this.restrictedStatusTypes;
  }

  /**
   * @description method of microfleet plugin lifecycle, plugin initialization
   * @returns {Promise<void>}
   */
  async init() {
    if (this.syncOnStart) {
      await this._start();
      this.logger.debug('twitter initialized, sync started');
    } else {
      this.logger.debug('twitter plugin initialized, no sync on start');
    }
  }

  /**
   * @description method of microfleet plugin lifecycle, plugin destruction
   * @returns {Promise<void>}
   */
  async destroy() {
    this.logger.debug('twitter service/plugin to be destroyed');
    await this._stop();
  }

  async _start() {
    this.isStopped = false;
    this.startTimer();
  }

  async _stop() {
    this.isStopped = true;
    this.stopTimer();
    await this.nitter.close();
  }

  // eslint-disable-next-line class-methods-use-this
  async connect() {
    // noop
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

  shouldNotifyFor(event, from) {
    const allow = this.notifyConfig[event];

    return Array.isArray(allow) && allow.includes(from);
  }

  shouldFilterTweet(data, tweetType) {
    return this.statusFilter.apply(data, tweetType, this.accountIds);
  }

  async _saveToStatuses(data, tweetType, directlyInserted) {
    const tweet = Twitter.serializeTweet(data);

    const status = { ...tweet, type: tweetType };

    if (directlyInserted) {
      status.explicit = true;
    }

    this.logger.trace({ status }, 'saving serialized status data');

    return this.storage
      .twitterStatuses()
      .save(status);
  }

  async _onData(data, notify = true) {
    if (!this.isSyncable()) {
      return false;
    }

    if (!isTweet(data)) {
      return false;
    }

    const tweetType = getTweetType(data);

    if (this.shouldFilterTweet(data, tweetType) !== false) {
      return false;
    }

    try {
      const saved = await this._saveToStatuses(data, tweetType, false);

      if (notify) {
        this.publish(saved);
      }

      return saved;
    } catch (err) {
      this.logger.warn({ id: data.id_str, err }, 'failed to save tweet');
      return false;
    }
  }

  publish(tweet) {
    const account = get(tweet, 'meta.account', false);
    const { following } = this;
    if (account && Array.isArray(following) && following.includes(account)) {
      const route = `twitter/subscription/${account}`;
      const payload = transform(tweet, TYPE_TWEET);
      this.core.emit(kPublishEvent, route, payload);
    } else {
      this.logger.trace({ tweet: tweet.id, account, following }, 'skipped broadcast');
    }
  }

  async syncTweet(tweetId) {
    try {
      const data = await this.nitter.fetchById(tweetId);

      if (data) {
        this.logger.debug({ data }, 'tweet fetchById');

        if (isTweet(data)) {
          // inserted directly using api/sync
          const tweetType = getTweetType(data);
          const saved = await this._saveToStatuses(data, tweetType, true);
          this.logger.debug({ tweetId }, 'tweet synced');
          return saved;
        }
      }

      return false;
    } catch (err) {
      this.logger.warn({ tweetId, err }, 'failed to sync tweet');
      throw new HttpStatusError(400, JSON.stringify(err));
    }
  }

  async syncFeed() {
    const feeds = await this.storage
      .feeds()
      .fetch({ network: 'twitter', invalid: false });

    const accounts = feeds.reduce(extractAccount, []);

    await hwp.forEach(accounts, async (item) => {
      await this.syncAccount(item.account);
    });

    this.logger.debug({ accounts }, 'resolved accounts');

    this.setFollowing(accounts);
    this.fillAccountIds(accounts);
  }

  isSyncable() {
    return !this.isStopped;
  }

  startTimer() {
    if (!this.isSyncable()) {
      this.logger.trace('twitter is not syncable');
      return;
    }

    if (this.syncTimer == null) {
      this.syncTimer = setTimeout(async () => {
        try {
          await this.syncFeed();
        } catch (err) {
          this.logger.warn({ err }, 'error occurred while syncing feeds');
        } finally {
          this.syncTimer = null;
          this.startTimer();
        }
      }, SYNC_INTERVAL);

      this.logger.trace('sync timer restarted');
    } else {
      this.logger.trace('sync timer is already running...');
    }
  }

  stopTimer() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async syncAccount(account) {
    if (this.loaders.has(account)) {
      return;
    }

    this.loaders.set(account, true);

    try {
      // calculate notification on sync
      const notify = this.shouldNotifyFor('data', 'sync');

      // recursively syncs account
      const lastTweet = await this.storage
        .twitterStatuses()
        .last({ account });

      this.logger.info({
        tweet: { id: lastTweet?.id },
        account,
      }, 'last tweet');

      let looped = true;
      let page = 1;
      let count = 0;
      let cursor = null;

      do {
        // eslint-disable-next-line no-await-in-loop
        const result = await this.nitter.fetchTweets(account, cursor);
        const tweets = result.tweets ?? [];
        cursor = result.cursorBottom;

        this.logger.debug({
          account,
          page,
          tweets: tweets.map((tweet) => tweet.id_str),
        }, 'tweets loaded');

        if (lastTweet) {
          for (const tweet of tweets) {
            if (lastTweet.id === tweet.id_str) {
              this.logger.debug({
                account,
                tweet_id: tweet.id_str,
              }, 'last known tweet reached, loader terminated');
              looped = false;
              break;
            }
          }
          if (!looped) {
            break;
          }
        }

        for (const tweet of tweets) {
          // eslint-disable-next-line no-await-in-loop
          await this._onData(tweet, notify);
        }

        looped = page < this.loaderMaxPages && tweets.length > 0;
        count += tweets.length;

        this.logger.debug({
          looped, page, cursor, count, account,
        }, 'tweet page loaded');

        if (looped) {
          page += 1;
        }
      } while (looped && !this.isStopped);
    } catch (err) {
      this.logger.warn({ err, account }, 'error occurred while tweet loading');
    } finally {
      this.loaders.delete(account);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async fillUserIds(original) {
    const screenNames = original
      .filter((element) => (element.id === undefined))
      .map((element) => (element.username));

    const accounts = [];
    for (const _username of screenNames) {
      // eslint-disable-next-line no-await-in-loop
      const { id, username } = await this.nitter.fetchUserId(_username);
      if (id) {
        accounts.push({ id, username });
      }
    }

    return merge(original, accounts);
  }
}

module.exports = Twitter;
