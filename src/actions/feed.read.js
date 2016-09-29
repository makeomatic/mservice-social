const { collectionResponse, TYPE_TWEET } = require('../utils/response');

/**
 * @api {http} <prefix>.feed.read Read feed by account with optional filters
 * @apiVersion 1.0.0
 * @apiName feed.read
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/feed.read.json} apiParam
 * @apiSchema {jsonschema=../../schemas/feed.read.response.json} apiSuccess
 */
function FeedReadAction({ params }) {
  const opts = {
    before: params.cursor,
  };

  return this
    .services
    .feed
    .read(params)
    .then(tweets => collectionResponse(tweets, TYPE_TWEET, opts));
}

FeedReadAction.schema = 'feed.read';
FeedReadAction.transports = ['http', 'amqp'];

module.exports = FeedReadAction;
