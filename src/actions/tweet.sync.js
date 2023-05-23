const { ActionTransport } = require('@microfleet/plugin-router');
const { modelResponse, TYPE_TWEET } = require('../utils/response');

/**
 * @api {http} <prefix>.tweet.sync Sync tweet by id
 * @apiVersion 1.0.0
 * @apiName tweet.sync
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/tweet.sync.json} apiParam
 */
function TweetSyncAction({ params }) {
  if ( process.env.TEST_MODE ) {
    return { data: null }
  }
  return this
    .service('feed')
    .syncOne(params)
    .then((tweet) => modelResponse(tweet, TYPE_TWEET));
}

TweetSyncAction.schema = 'tweet.sync';
TweetSyncAction.transports = [ActionTransport.amqp];

module.exports = TweetSyncAction;
