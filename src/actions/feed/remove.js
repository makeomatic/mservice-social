/**
 * @api {http} <prefix>.feed.remove Remove feed
 * @apiVersion 1.0.0
 * @apiName feed.remove
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../../schemas/feed.remove.json} apiParam
 */
function FeedRegisterAction({ params }) {
  return this.services.feed.remove(params);
}

FeedRegisterAction.schema = 'feed.remove';
FeedRegisterAction.transports = ['amqp'];

module.exports = FeedRegisterAction;
