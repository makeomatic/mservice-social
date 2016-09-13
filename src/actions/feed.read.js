const omit = require('lodash/omit');
const allowed = require('../allowed');

/**
 * @api {http} <prefix>.feed.read Read feed by account with optional filters
 * @apiVersion 1.0.0
 * @apiName feed.read
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.read.json} apiParam
 */
function FeedReadAction(request) {
  const { params } = request;
  return this.services.feed.read(omit(params, 'token'));
}

FeedReadAction.allowed = allowed;
FeedReadAction.auth = 'token';
FeedReadAction.schema = 'feed.read';
FeedReadAction.transports = ['http'];

module.exports = FeedReadAction;
