/**
 * @api {http} <prefix>.facebook.webhook Verify subscription, get feed updates from facebook
 * @apiVersion 1.0.0
 * @apiName facebook.webhook
 * @apiGroup Facebook
 * @apiSchema {jsonschema=../../schemas/webhook.json} apiParam
 */
function webhookAction({ params }) {
  const facebookService = this.services.facebook;

  if (params['hub.mode'] === 'subscribe') {
    return facebookService.verifySubcription(params);
  }

  return facebookService.saveStatus(params);
}

webhookAction.schema = 'webhook';
webhookAction.transports = ['http'];

module.exports = webhookAction;
