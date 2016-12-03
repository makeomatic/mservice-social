const Media = require('./facebook/media');
const omit = require('lodash/omit');
const proofGenerator = require('./facebook/proof-generator');
const Promise = require('bluebird');
const request = require('request-promise');
const Subscription = require('./facebook/subscription');

class Facebook {
  constructor(config, storage, feed, logger) {
    this.config = config;
    this.feed = feed;
    this.logger = logger;
    this.storage = storage;

    this.media = new Media(this);
    this.subscription = new Subscription(this);
  }

  request(options, accessToken) {
    const method = options.method || 'get';
    const path = options.url;
    const { version } = this.config.api;
    const requestOptions = Object.assign(
      {
        json: true,
        qs: {},
        url: `https://graph.facebook.com/${version}${path}`,
      },
      omit(options, 'method', 'url')
    );
    const handler = request[method];

    if (accessToken) {
      requestOptions.qs.appsecret_proof = proofGenerator(this.config.app.secret, accessToken);
      requestOptions.qs.access_token = accessToken;
    }

    return Promise
      .bind(this, handler(requestOptions))
      .catch((response) => {
        const error = response.error.error;

        /**
         * 4: Application-level throttling 200 calls/person/hour
         * 32: Page-level throttling 4800 calls/person/24-hours
         */
        if (error && [4, 32].includes(error.code)) {
          this.logger.warn('Trying to repeat request after 1000*60ms because', error);

          return Promise.bind(this, options).delay(1000 * 60).then(this.request);
        }

        throw error;
      });
  }
}

module.exports = Facebook;
