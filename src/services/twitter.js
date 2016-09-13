const TwitterClient = require('twitter');
const { isObject, isString, isArray, conforms } = require('lodash');
const Errors = require('common-errors');

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
    this.listeners = {};
    this.storage = storage;
    this.logger = logger;

    this.isTweet = conforms({
      entities: isObject,
      id_str: isString,
      text: isString,
    });
  }

  init() {
    return this.storage
      .fetchFeeds({ network: 'twitter' })
      .bind(this)
      .map(this.listen)
      .then(this.log)
      .catch(this.error);
  }

  listen(row) {
    const params = {};

    if (row.filter.account) {
      params.follow = row.filter.account;
    }

    if (row.filter.hashtags) {
      params.track = row.filter.hashtags.join(',').replace(/#/ig, '');
    }

    if (!params.follow && !params.track) {
      throw new Errors.ArgumentError(`${row.id} is missing account to follow or hashtags to track`);
    }

    if (!(row.id in this.listeners)) {
      const listener = this.client.stream('statuses/filter', params);

      listener.on('data', data => {
        this.onData.call(this, row.id, data);
      });
      listener.on('error', this.error.bind(this));

      this.listeners[row.id] = listener;

      this.logger.info(`Added listener ${row.id} for ${row.internal} on ${row.network}`);
    }

    return true;
  }

  log(results) {
    let data = results;
    if (!isArray(data)) {
      data = [results];
    }
    data.map(this.logger.info.bind(this.logger));
  }

  error(exception) {
    this.logger.error(exception);
  }

  onData(feed, data) {
    if (this.isTweet(data)) {
      const status = {
        id: data.id_str,
        feed_id: feed,
        date: data.created_at,
        text: data.text,
        meta: {
          hashtags: data.entities.hashtags,
          mentions: data.entities.user_mentions,
        },
      };

      this.storage.insertStatus(status).return(true);
    }
  }
}

module.exports = Twitter;
