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
    minTimeout: 10000,
    maxTimeout: Infinity,
    randomize: true,
  };

  static throttleCodes = [4, 32];

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
    const self = this.ctx;

    /**
     * 4: Application-level throttling 200 calls/person/hour
     * 32: Page-level throttling 4800 calls/person/24-hours
     */
    if (error && Facebook.throttleCodes.includes(error.code)) {
      const timeout = retry.createTimeout(this.attempt, Facebook.timeoutOptions);

      // notify of throttling error
      self.logger.warn('Trying to repeat request after %d ms because', timeout, error);

      return Promise
        .bind(self, [this.options, this.accessToken, this.attempt + 1])
        .delay(timeout)
        .spread(self.request);
    }

    return Promise.reject(response);
  }

  request(options, accessToken, attempt = 0) {
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
      .bind({
        options, accessToken, attempt, ctx: this,
      })
      .catch(this.handleError);
  }
}

module.exports = Facebook;
