const omit = require('lodash/omit');
const allowed = require('../allowed');

/**
 * @api {http} <prefix>.feed.list List feeds registered in the system
 * @apiVersion 1.0.0
 * @apiName feed.list
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.list.json} apiParam
 */
function FeedListAction(request) {
  const { params } = request;
  return this.services.feed.list(omit(params, 'token'));
}

FeedListAction.allowed = allowed;
FeedListAction.auth = 'token';
FeedListAction.schema = 'feed.list';
FeedListAction.transports = ['http'];

module.exports = FeedListAction;
