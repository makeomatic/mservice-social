const { NotSupportedError } = require('common-errors');

/**
 * @api {http} <prefix>.facebook.webhook Verify subscription, save media from facebook
 * @apiVersion 1.0.0
 * @apiName facebook.webhook
 * @apiGroup Facebook
 * @apiSchema {jsonschema=../../../schemas/facebook.webhook.json} apiParam
 */
function webhookAction({ params, query, method }) {
  const facebook = this.service('facebook');

  if (method === 'get' && query['hub.mode'] === 'subscribe') {
    return facebook
      .subscription
      .verify(query);
  }

  if (method === 'post') {
    return facebook
      .subscription
      .save(params);
  }

  throw new NotSupportedError();
}

webhookAction.schema = 'facebook.webhook';
webhookAction.transports = ['http'];

module.exports = webhookAction;
