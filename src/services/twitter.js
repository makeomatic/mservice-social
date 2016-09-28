const Promise = require('bluebird');
const TwitterClient = require('twitter');
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
      .then(this.listen)
      .catch(this.error);
  }

  listen(rows) {
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
    this.logger.error(exception);
  }

  _onData(data) {
    if (this.isTweet(data)) {
      const status = {
        date: data.created_at,
        text: data.text,
        meta: {
          id_str: data.id_str,
          account: data.user.screen_name,
          account_id: data.user.id_str,
          entities: data.entities,
        },
      };

      this.storage.insertStatus(status).return(true);
    }
  }

  fillUserIds(original) {
    return Promise
      .fromCallback((next) => {
        const screenNames = original
          .filter(element => (element.id === undefined))
          .map(element => (element.username))
          .join(',');
        if (screenNames === '') {
          next([]);
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
