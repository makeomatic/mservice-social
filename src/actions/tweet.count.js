const { ActionTransport } = require('@microfleet/plugin-router');

/**
 * @api {http} <prefix>.tweet.count Tweet count by accounts
 * @apiVersion 1.0.0
 * @apiName tweet.count
 * @apiGroup Feed
 * @apiSchema {jsonschema=../../schemas/tweet.count.json} apiParam
 */
async function TweetCountAction({ params }) {
  if ( process.env.TEST_MODE ) {
    return { data: 0 }
  }
  const data = await this.service('feed')
    .countByAccounts(params.data);
  return { data };
}

TweetCountAction.schema = 'tweet.count';
TweetCountAction.transports = [ActionTransport.amqp];

module.exports = TweetCountAction;
