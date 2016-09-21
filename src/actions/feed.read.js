/**
 * @api {http} <prefix>.feed.read Read feed by account with optional filters
 * @apiVersion 1.0.0
 * @apiName feed.read
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.read.json} apiParam
 */
function FeedReadAction(request) {
  return this.services.feed.read(request.params);
}

FeedReadAction.schema = 'feed.read';
FeedReadAction.transports = ['http', 'amqp'];

module.exports = FeedReadAction;
