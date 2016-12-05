/**
 * @api {amqp} <prefix>.feed.remove Remove feed
 * @apiVersion 1.0.0
 * @apiName feed.remove
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.remove.json} apiParam
 */
function feedRemoveAction({ params }) {
  return this.service('feed').remove(params);
}

feedRemoveAction.schema = 'feed.remove';
feedRemoveAction.transports = ['amqp'];

module.exports = feedRemoveAction;
