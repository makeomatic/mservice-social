const Promise = require('bluebird');
const TwitterClient = require('twitter');
const BN = require('bn.js');
const { isObject, isString, conforms, merge, find, reduce, map } = require('lodash');

function extractAccount(accum, value) {
  const accountId = value.meta.account_id;

  // if we have accountId & we dont have it yet
  if (accountId && !find(accum, { account_id: accountId })) {
    accum.push(value.meta);
  }

  return accum;
}

class Twitter {
  /**
   * @param {object} config
   * @param {object} feed
   */
  constructor(config, feed) {
    this.client = new TwitterClient(config);
    this.listener = null;
    this.feed = feed;
    this.logger = feed.logger;
    this.name = 'twitter';

    // cheaper than bind
    this.onData = json => this._onData(json);
    this.onError = err => this._onError(err);
    this.onEnd = () => this._onEnd();

    return this.init().then(() => this.logger.info('Twitter initialized')).then(() => this);
  }

  async init() {
    this.reconnect = null;

    try {
      const feeds = await this.feed.list({ filter: { network: 'twitter' } });
      const accounts = reduce(feeds, extractAccount, []);
      const sync = map(accounts, async account => await this.syncAccount(account, 'desc'));
      return Promise.all(sync).then(() => this.listen(accounts));
    } catch (exception) {
      this.logger.error('stream connection failed', exception);
      return this._destroyAndReconnect();
    }
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

    // TODO: do this!
    // add 'delete' handler
    // listener.on('delete', this.onDelete);

    // remap stream receiver to add 90 sec timeout
    const receive = listener.receive;
    listener.receive = (chunk) => {
      this.resetTimeout();
      receive.call(listener, chunk);
    };

    // init new reset timer
    this.resetTimeout();

    this.logger.info(
      'Listening for %d accounts on %s. Account list: %s',
      accounts.length,
      params.follow // eslint-disable-line
    );
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

  refresh() {
    // schedule reconnect
    if (this.reconnect) {
      this.logger.warn('reconnect was scheduled, skipping...');
      return Promise.resolve();
    }

    this.logger.warn('scheduled reconnect in 1000ms');
    this.reconnect = Promise.bind(this).delay(1000).then(this.init);

    return this.reconnect;
  }

  destroy() {
    // reconnect if we failed
    if (this.listener) {
      this.listener.removeAllListeners();
      this.listener.destroy();
      this.listener = null;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  _destroyAndReconnect() {
    this.destroy();
    return this.refresh();
  }

  _onError(exception) {
    this.logger.error('stream connection failed', exception);
    this._destroyAndReconnect();
  }

  _onEnd() {
    this.logger.warn('stream connection closed');
    this._destroyAndReconnect();
  }

  _onData(data) {
    if (Twitter.isTweet(data)) {
      this.logger.debug('inserting tweet', data);
      this.feed
        .insertStatus(Twitter.serializeTweet(data))
        .return(true);
    }
  }

  fetchTweets(cursor, account, cursorField = 'max_id') {
    this.logger.debug('fetching tweets for %s based on %s %s', account, cursorField, cursor);
    const twitter = this.client;
    const params = {
      count: 200,
      screen_name: account,
      trim_user: false,
      exclude_replies: false,
      include_rts: true,
    };
    if (cursor) {
      params[cursorField] = cursor;
    }

    return Promise.fromCallback(next => twitter.get('statuses/user_timeline', params, next));
  }

  async syncAccount(_account, order = 'asc') {
    const feed = this.feed;
    const { account } = _account;
    let [latest] = await feed.statuses({
      filter: {
        network: this.name,
        page: 0,
        account,
        pageSize: 1,
        order,
      },
    });

    // TODO: subject to rate limit
    let size = -1;
    while (size !== 0) {
      const inTweets = await this.fetchTweets(
        Twitter.cursor(latest, order),
        account,
        order === 'asc' ? 'max_id' : 'since_id'
      );

      const outTweets = map(inTweets, Twitter.serializeTweet);
      const insert = map(outTweets, async tweet => await feed.insertStatus(tweet));

      size = inTweets.length;
      latest = await Promise.all(insert).get(order === 'asc' ? size - 1 : 0);
    }
  }

  expandAccounts(original) {
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
Twitter.cursor = (tweet, order = 'asc') => {
  const cursor = tweet && (tweet.id || tweet.id_str);

  // no tweet / cursor
  if (!cursor) {
    return undefined;
  }

  if (order === 'desc') {
    return cursor;
  }

  return new BN(cursor, 10).sub(Twitter.one).toString(10);
};

Twitter.serializeTweet = (data, noSerialize) => {
  const tweet = {
    id: data.id_str,
    network: 'twitter',
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
};

module.exports = Twitter;
