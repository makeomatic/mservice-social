const Media = require('./facebook/media');
const omit = require('lodash/omit');
const proofGenerator = require('./facebook/proof-generator');
const Promise = require('bluebird');
const request = require('request-promise');
const retry = require('retry');
const Subscription = require('./facebook/subscription');

class Facebook {
  static timeoutOptions = {
    retries: Infinity,
    factor: 2,
    minTimeout: 60000,
    maxTimeout: Infinity,
    randomize: true,
  };

  constructor(config, storage, feed, logger) {
    this.config = config;
    this.feed = feed;
    this.logger = logger;
    this.storage = storage;

    this.media = new Media(this);
    this.subscription = new Subscription(this);
  }

  handleError(response) {
    const error = response.error && response.error.error;

    /**
     * 4: Application-level throttling 200 calls/person/hour
     * 32: Page-level throttling 4800 calls/person/24-hours
     */
    if (error && [4, 32].includes(error.code)) {
      const timeout = retry.createTimeout(this.attempt, Facebook.timeoutOptions);

      // notify of throttling error
      this.logger.warn('Trying to repeat request after %d ms because', timeout, error);

      return Promise
        .bind(this.ctx, [this.options, this.accessToken, this.attempt + 1])
        .delay(timeout)
        .spread(this.request);
    }

    return Promise.reject(response);
  }

  request(options, accessToken, attempt = 1) {
    const method = options.method || 'get';
    const path = options.url;
    const { version } = this.config.api;

    const requestOptions = Object.assign(
      {
        json: true,
        qs: {},
        url: `https://graph.facebook.com/${version}${path}`,
      },
      omit(options, 'method', 'url', 'retry', 'attempt')
    );
    const handler = request[method];

    if (accessToken) {
      requestOptions.qs.appsecret_proof = proofGenerator(this.config.app.secret, accessToken);
      requestOptions.qs.access_token = accessToken;
    }

    return Promise
      .bind(this, handler(requestOptions))
      .bind({ options, accessToken, attempt, ctx: this })
      .catch(this.handleError);
  }
}

module.exports = Facebook;
