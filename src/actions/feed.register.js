/**
 * @api {http} <prefix>.feed.register Register new feed source
 * @apiVersion 1.0.0
 * @apiName feed.register
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.register.json} apiParam
 */
function FeedRegisterAction({ params }) {
  return this.services.feed.register(params);
}

FeedRegisterAction.schema = 'feed.register';
FeedRegisterAction.transports = ['amqp'];

module.exports = FeedRegisterAction;
