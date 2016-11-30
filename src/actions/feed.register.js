const { collectionResponse, TYPE_FEED } = require('../utils/response');
const Social = require('../');

/**
 * @api {http} <prefix>.feed.register Register new feed source
 * @apiVersion 1.0.0
 * @apiName feed.register
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.register.json} apiParam
 */
function feedRegisterAction({ params }) {
  return this
    .service(Social.SERVICE_FEED)
    .register(params)
    .then(feeds => collectionResponse(feeds, TYPE_FEED));
}

feedRegisterAction.schema = 'feed.register';
feedRegisterAction.transports = ['amqp'];

module.exports = feedRegisterAction;
