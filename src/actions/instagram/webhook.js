const Errors = require('common-errors');
const Promise = require('bluebird');
const values = require('lodash/values');
const { SERVICE_FEED, SERVICE_INSTAGRAM, NETWORK_INSTAGRAM } = require('../..');

/**
 * @api {http} <prefix>.instagram.webhook Verify subscription, save media from instagram
 * @apiVersion 1.0.0
 * @apiName instagram.webhook
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../../schemas/instagram.webhook.json} apiParam
 */
function webhookAction({ params, query, method }) {
  if (method === 'get') {
    return webhookAction.verify.call(this, query);
  }

  if (method === 'amqp' && params['hub.mode'] === 'subscribe') {
    return webhookAction.verify.call(this, params);
  }

  return webhookAction.hook.call(this, params);
}

/**
 * Accepts webhook verification request and completes the challenge
 * @param  {Object} query
 * @return {Promise}
 */
webhookAction.verify = function verify(query) {
  const instagramService = this.getService(SERVICE_INSTAGRAM);
  return instagramService.verifySubcription(query);
};

/**
 * Accepts webhook data and processes it
 * @param  {Object} params
 * @return {PRomise}
 */
webhookAction.hook = function hook(params) {
  const feedService = this.getService(SERVICE_FEED);
  const instagramService = this.getService(SERVICE_INSTAGRAM);
  const rawMediaData = values(params);

  return Promise.map(rawMediaData, (subscription) => {
    const { object_id: networkId, data: { media_id: mediaId } } = subscription;

    return feedService
      .getByNetworkId(NETWORK_INSTAGRAM, networkId)
      .tap((feed) => {
        if (feed) return;

        throw new Errors.NotFoundError(`Feed for user #${networkId}`);
      })
      .then(feed => instagramService.fetchMedia(mediaId, feed.meta.token));
  })
  .map(media => instagramService.saveMedia(media))
  .then(({ length }) => ({ media: length }));
};

// internals
webhookAction.schema = 'instagram.webhook';
webhookAction.transports = ['amqp', 'http'];

module.exports = webhookAction;
