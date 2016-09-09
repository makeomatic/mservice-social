const TwitterClient = require('twitter');
const moment = require('moment');
const { isObject, isString, isArray, conforms } = require('lodash');

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
    this.listeners = [];
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

    if (row.account) {
      params.follow = row.account;
    }

    if (row.hashtags) {
      params.track = row.hashtags.join(',').replace(/#/ig, '');
    }

    if (!params.follow && !params.track) {
      return false;
    }

    const listener = this.client.stream('statuses/filter', params);

    listener.on('data', this.onData.bind(this));
    listener.on('error', this.error.bind(this));

    this.listeners.push(listener);

    return true;
  }

  log(results) {
    let data = results;
    if (!isArray(data)) {
      data = [results];
    }
    data.map(this.logger.info);
  }

  error(exception) {
    this.logger.error(exception);
  }

  onData(data) {
    if (this.isTweet(data)) {
      const status = {
        id: data.id_str,
        hashtags: data.entities.hashtags,
        mentions: data.entities.user_mentions,
        text: data.text,
        date: moment(data.created_at).toDate(),
      };

      this.storage.insert(status).then(this.log);
    }
  }
}

module.exports = Twitter;
