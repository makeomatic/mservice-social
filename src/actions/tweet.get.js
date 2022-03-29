const { ActionTransport } = require('@microfleet/plugin-router');
const { modelResponse, TYPE_TWEET } = require('../utils/response');

/**
 * @api {http} <prefix>.tweet.sync Read tweet by id
 * @apiVersion 1.0.0
 * @apiName tweet.get
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/tweet.sync.json} apiParam
 */
function TweetGetAction({ params }) {
  return this
    .service('feed')
    .getOne(params)
    .then((tweet) => modelResponse(tweet, TYPE_TWEET));
}

TweetGetAction.schema = 'tweet.get';
TweetGetAction.transports = [ActionTransport.amqp];

module.exports = TweetGetAction;
