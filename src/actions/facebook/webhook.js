const { NotSupportedError } = require('common-errors');
/**
 * @api {http} <prefix>.facebook.webhook Verify subscription, get feed updates from facebook
 * @apiVersion 1.0.0
 * @apiName facebook.webhook
 * @apiGroup Facebook
 * @apiSchema {jsonschema=../../../schemas/webhook.json} apiParam
 */
function webhookAction({ params }) {
  const feedService = this.services.feed;
  const facebookService = feedService.getNetwork('facebook');

  if (facebookService) {
    if (params['hub.mode'] === 'subscribe') {
      return facebookService.verifySubcription(params);
    }

    return facebookService.saveStatus(params);
  }
  throw new NotSupportedError('Facebook service disabled');
}

webhookAction.schema = 'webhook';
webhookAction.transports = ['http'];

module.exports = webhookAction;
