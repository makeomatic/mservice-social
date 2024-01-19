const { setTimeout } = require('node:timers/promises');
const omit = require('lodash/omit');
const get = require('get-value');
const Promise = require('bluebird');
const request = require('request-promise');
const retry = require('retry');
const proofGenerator = require('./facebook/proof-generator');
const Media = require('./facebook/media');
const Subscription = require('./facebook/subscription');
const { mangleToken } = require('../utils/logging');

class Facebook {
  static getErrorCode(response) {
    return get(response, 'error.error.code');
  }

  static isThrottleError(response) {
    /**
     * 4: Application-level throttling 200 calls/person/hour
     * 32: Page-level throttling 4800 calls/person/24-hours
     */
    return [4, 32].includes(Facebook.getErrorCode(response));
  }

  static isInvalidTokenError(response) {
    return this.accessToken != null
      && (response.statusCode === 400)
      && (Facebook.getErrorCode(response) === 190);
  }

  constructor(core, config, storage, feed, logger) {
    this.core = core;

    this.config = config;
    this.feed = feed;
    this.logger = logger;
    this.storage = storage;
    this.request = this.request.bind(this);

    this.media = new Media(this);
    this.subscription = new Subscription(this);
    this.cancellable = [];
  }

  /**
   * @description plugin lifecycle, initialization
   * @returns {Promise<void>}
   */
  async init() {
    this.logger.debug('facebook service/plugin initialization.');

    if (this.config.subscribeOnStart) {
      this.logger.debug('facebook service/plugin will subscribe in 60 seconds.');

      await setTimeout(60000, null, { ref: false });

      const job = this.subscription.subscribe();
      this.cancellable.push(job);
      await job;

      this.logger.debug('facebook subscription initialized.');
    } else {
      this.logger.debug('facebook service/plugin subscription skipped.');
    }

    if (this.config.syncMediaOnStart) {
      await this.media.syncPagesHistory();
      this.logger.debug('facebook media synced.');
    }
  }

  /**
   * @description plugin lifecycle, destruction
   * @returns {Promise<void>}
   */
  async destroy() {
    for (const job of this.cancellable) {
      job.cancel();
    }
    this.cancellable = [];
    this.logger.debug('facebook service/plugin destroyed.');
  }

  retry(response) {
    const self = this.ctx;
    const timeout = retry.createTimeout(this.attempt, Facebook.timeoutOptions);

    // notify of throttling error
    self.logger.warn('Trying to repeat request after %d ms because of %j', timeout, response.error.error);

    return Promise
      .bind(self, [this.options, this.accessToken, this.attempt + 1])
      .delay(timeout)
      .spread(self.request);
  }

  invalidateToken() {
    const { ctx, accessToken } = this;

    ctx.logger.warn('Invalidate facebook token %s', mangleToken(accessToken));
    return ctx.storage.feeds().invalidate('facebook', accessToken);
  }

  request(options, accessToken, attempt = 0) {
    const method = options.method || 'get';
    const path = options.url;
    const { version } = this.config.api;

    const requestOptions = {
      json: true,
      qs: {},
      url: `https://graph.facebook.com/${version}${path}`,
      ...omit(options, 'method', 'url', 'retry', 'attempt'),
    };
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
      .tapCatch(Facebook.isInvalidTokenError, this.invalidateToken)
      .catch(Facebook.isThrottleError, this.retry);
  }
}

Facebook.timeoutOptions = {
  retries: Infinity,
  factor: 2,
  minTimeout: 10000,
  maxTimeout: Infinity,
  randomize: true,
};

module.exports = Facebook;
