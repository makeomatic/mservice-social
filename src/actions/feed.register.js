const omit = require('lodash/omit');
const allowed = require('../allowed');

/**
 * @api {http} <prefix>.feed.register Register new feed source
 * @apiVersion 1.0.0
 * @apiName feed.register
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.register.json} apiParam
 */
function FeedRegisterAction(request) {
  const { params } = request;
  return this.services.feed.register(omit(params, 'token'));
}

FeedRegisterAction.allowed = allowed;
FeedRegisterAction.auth = 'token';
FeedRegisterAction.schema = 'feed.register';
FeedRegisterAction.transports = ['http'];

module.exports = FeedRegisterAction;
