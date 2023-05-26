const { ActionTransport } = require('@microfleet/plugin-router');
const { collectionResponse, TYPE_FEED } = require('../utils/response');
const { SERVICE_FEED } = require('../constants');

/**
 * @api {http} <prefix>.feed.register Register new feed source
 * @apiVersion 1.0.0
 * @apiName feed.register
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.register.json} apiParam
 */
function feedRegisterAction({ params }) {
  return this
    .service(SERVICE_FEED)
    .register(params)
    .then((feeds) => collectionResponse(feeds, TYPE_FEED));
}

feedRegisterAction.schema = 'feed.register';
feedRegisterAction.transports = [ActionTransport.amqp];

module.exports = feedRegisterAction;
