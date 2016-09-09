const Errors = require('common-errors');
const omit = require('lodash/omit');

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

const allowed = request => {
  const { auth } = request;

  if (auth.credentials.isAdmin !== true) {
    return Promise.reject(new Errors.NotPermittedError('Not an admin'));
  }

  return Promise.resolve(request);
};

FeedListAction.allowed = allowed;
FeedListAction.auth = 'token';
FeedListAction.schema = 'feed.list';
FeedListAction.transports = ['http'];

module.exports = FeedListAction;
