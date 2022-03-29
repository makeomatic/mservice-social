const { ActionTransport } = require('@microfleet/plugin-router');
const { collectionResponse, TYPE_FEED } = require('../utils/response');

/**
 * @api {http} <prefix>.feed.list List feeds registered in the system
 * @apiVersion 1.0.0
 * @apiName feed.list
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.list.json} apiParam
 * @apiSchema {jsonschema=../../schemas/feed.list.response.json} apiSuccess
 */
function FeedListAction({ params }) {
  return this
    .service('feed')
    .list(params)
    .then((feeds) => collectionResponse(feeds, TYPE_FEED));
}

FeedListAction.schema = 'feed.list';
FeedListAction.transports = [ActionTransport.amqp];

module.exports = FeedListAction;
