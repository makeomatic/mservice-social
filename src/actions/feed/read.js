const { collectionResponse, TYPE_TWEET, TYPE_FACEBOOK_STATUS, TYPE_INSTAGRAM_MEDIA } = require('../../utils/response');

/**
 * @api {http} <prefix>.feed.read Read feed by account with optional filters
 * @apiVersion 1.0.0
 * @apiName feed.read
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../../schemas/feed.read.json} apiParam
 * @apiSchema {jsonschema=../../../schemas/feed.read.response.json} apiSuccess
 */
function FeedReadAction({ params }) {
  const opts = {
    before: params.cursor,
  };

  let responseType = null;
  if (params.filter.network === 'twitter') {
    responseType = TYPE_TWEET;
  } else if (params.filter.network === 'facebook') {
    responseType = TYPE_FACEBOOK_STATUS;
  } else if (params.filter.network === 'instagram') {
    responseType = TYPE_INSTAGRAM_MEDIA;
  }

  return this
    .services
    .feed
    .statuses(params)
    .then(tweets => collectionResponse(tweets, responseType, opts));
}

FeedReadAction.schema = 'feed.read';
FeedReadAction.transports = ['http', 'amqp'];

module.exports = FeedReadAction;
