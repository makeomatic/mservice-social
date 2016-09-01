const Errors = require('common-errors');
const Promise = require('bluebird');

/**
 * @api {http} <prefix>.feed.sync Sync feeds
 * @apiVersion 1.0.0
 * @apiName feed.sync
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.sync.json} apiParam
 */
function FeedSyncAction(request) {
  const { params } = request;
  return this.services.feed.sync(params);
}

const allowed = request => {
  const { auth } = request;

  if (auth.credentials.isAdmin !== true) {
    return Promise.reject(new Errors.NotPermittedError('Not an admin'));
  }

  return Promise.resolve(request);
};

FeedSyncAction.allowed = allowed;
FeedSyncAction.auth = 'token';
FeedSyncAction.schema = 'feed.sync';
FeedSyncAction.transports = ['http'];

module.exports = FeedSyncAction;
