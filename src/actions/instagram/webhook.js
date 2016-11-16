/**
 * @api {http} <prefix>.instagram.webhook Verify subscription, save media from instagram
 * @apiVersion 1.0.0
 * @apiName instagram.webhook
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../schemas/webhook.json} apiParam
 */
function webhookAction({ params }) {
  const instagramService = this.services.instagram;

  if (params['hub.mode'] === 'subscribe') {
    return instagramService.verifySubcription(params);
  }

  return instagramService.saveMedia(params);
}

webhookAction.schema = 'webhook';
webhookAction.transports = ['http'];

module.exports = webhookAction;
