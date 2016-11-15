/**
 * @api {http} <prefix>.instagram.webhook Verify subscription, save media from instagram
 * @apiVersion 1.0.0
 * @apiName instagram.webhook
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../schemas/instagram.webhook.json} apiParam
 */
function webhookAction({ params }) {
  const instagramService = this.getService('instagram');

  if (params['hub.mode'] === 'subscribe') {
    return instagramService.verifySubcription(params);
  }

  return instagramService.saveMedia(params);
}

webhookAction.schema = 'instagram.webhook';
webhookAction.transports = ['amqp'];

module.exports = webhookAction;
