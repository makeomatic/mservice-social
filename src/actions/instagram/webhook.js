const Errors = require('common-errors');
const Promise = require('bluebird');
const values = require('lodash/values');
const { SERVICE_FEED, SERVICE_INSTAGRAM, NETWORK_INSTAGRAM } = require('../..');

/**
 * @api {http} <prefix>.instagram.webhook Verify subscription, save media from instagram
 * @apiVersion 1.0.0
 * @apiName instagram.webhook
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../schemas/instagram.webhook.json} apiParam
 */
function webhookAction({ params }) {
  const feedService = this.getService(SERVICE_FEED);
  const instagramService = this.getService(SERVICE_INSTAGRAM);

  if (params['hub.mode'] === 'subscribe') {
    return instagramService.verifySubcription(params);
  }

  return Promise
    .map(values(params), (subscription) => {
      const { object_id: networkId, data: { media_id: mediaId } } = subscription;

      return feedService
        .getByNetworkId(NETWORK_INSTAGRAM, networkId)
        .tap((feed) => {
          if (feed === undefined) {
            throw new Errors.NotFoundError(`Feed for user #${networkId}`);
          }
        })
        .then(feed => instagramService.fetchMedia(mediaId, feed.meta.token));
    })
    .map(media => instagramService.saveMedia(media))
    .then(({ length }) => ({ media: length }));
}

webhookAction.schema = 'instagram.webhook';
webhookAction.transports = ['amqp'];

module.exports = webhookAction;
