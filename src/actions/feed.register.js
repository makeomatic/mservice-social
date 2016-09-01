const Errors = require('common-errors');
const Promise = require('bluebird');

/**
 * @api {http} <prefix>.feed.register Register new feed source
 * @apiVersion 1.0.0
 * @apiName feed.register
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.register.json} apiParam
 */
function FeedRegisterAction(request) {
  const { params } = request;
  return this.services.feed.register(params);
}

const allowed = request => {
  const { auth } = request;

  if (auth.credentials.isAdmin !== true) {
    return Promise.reject(new Errors.NotPermittedError('Not an admin'));
  }

  return Promise.resolve(request);
};

FeedRegisterAction.allowed = allowed;
FeedRegisterAction.auth = 'token';
FeedRegisterAction.schema = 'feed.register';
FeedRegisterAction.transports = ['http'];

module.exports = FeedRegisterAction;
