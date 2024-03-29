const Promise = require('bluebird');
const request = require('request-promise');
const get = require('get-value');
const Comments = require('./instagram/comments');
const Media = require('./instagram/media');
const { mangleToken } = require('../utils/logging');

const comments = new WeakMap();
const media = new WeakMap();

class InstagramService {
  static isInvalidTokenError(response) {
    return response.statusCode === 400
      && get(response, 'error.meta.code') === 400
      && get(response, 'error.meta.error_type') === 'OAuthAccessTokenException';
  }

  constructor(core, config, storage, logger) {
    this.core = core;
    this.config = config;
    this.storage = storage;
    this.logger = logger;
    this.request = this.request.bind(this);

    const instagramComments = new Comments(this);
    const instagramMedia = new Media(this, instagramComments);

    comments.set(this, instagramComments);
    media.set(this, instagramMedia);
  }

  comments() {
    return comments.get(this);
  }

  media() {
    return media.get(this);
  }

  async invalidateToken() {
    const { ctx, accessToken } = this;
    ctx.logger.warn('Invalidate instagram token %s', mangleToken(accessToken));
    await ctx.storage.feeds().invalidate('instagram', accessToken);
  }

  request({ method = 'get', ...options }, accessToken) {
    return Promise
      .resolve(request[method](options))
      .bind({ ctx: this, accessToken })
      .tapCatch(InstagramService.isInvalidTokenError, this.invalidateToken);
  }
}

module.exports = InstagramService;
