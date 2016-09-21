/**
 * @api {http} <prefix>.feed.list List feeds registered in the system
 * @apiVersion 1.0.0
 * @apiName feed.list
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.list.json} apiParam
 */
function FeedListAction(request) {
  return this.services.feed.list(request.params);
}

FeedListAction.schema = 'feed.list';
FeedListAction.transports = ['amqp'];

module.exports = FeedListAction;
