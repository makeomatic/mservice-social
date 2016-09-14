const TwitterClient = require('twitter');
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
    this.listener = null;
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

    if (this.listener !== null) {
      // remove old listener
      this.listener.destroy();
      this.listener = null;
    }

    this.listener = this.client.stream('statuses/filter', params);
    this.listener.on('data', data => {
      this.onData.call(this, data);
    });
    this.listener.on('error', this.error.bind(this));

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

  error(exception) {
    this.logger.error(exception);
  }

  onData(data) {
    if (this.isTweet(data)) {
      const status = {
        id: data.id_str,
        date: data.created_at,
        text: data.text,
        meta: {
          account: data.user.screen_name,
          hashtags: data.entities.hashtags,
          mentions: data.entities.user_mentions,
        },
      };

      this.storage.insertStatus(status).return(true);
    }
  }

  getUserId(screenName) {
    return new Promise((resolve, reject) => {
      this.client.get(
        'users/lookup',
        { screen_name: screenName.join(screenName) },
        function lookupResult(error, tweets) {
          if (error) {
            return reject(error);
          }

          return resolve(tweets.reduce((acc, value) => {
            acc.push(value.id_str);
            return acc;
          }, []));
        });
    });
  }
}

module.exports = Twitter;
