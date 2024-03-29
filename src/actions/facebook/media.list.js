const Errors = require('common-errors');
const { ActionTransport } = require('@microfleet/plugin-router');
const { collectionResponse, TYPE_FACEBOOK_MEDIA } = require('../../utils/response');

/**
 * @api {http} <prefix>.facebook.media.list Get list of media
 * @apiVersion 1.0.0
 * @apiName facebook.media.list
 * @apiGroup Facebook
 * @apiSchema {jsonschema=../../../schemas/facebook.media.list.json} apiParam
 */
function facebookMediaListAction({ params, method }) {
  const facebookService = this.service('facebook');

  if (method !== 'post' && method !== 'amqp') {
    throw new Errors.NotImplementedError('media list is only available through HTTP Post or AMQP');
  }

  return facebookService.media
    .list(params)
    .then((list) => collectionResponse(list, TYPE_FACEBOOK_MEDIA, {
      before: params.page.cursor,
      cursor: 'created_time',
    }));
}

facebookMediaListAction.schema = 'facebook.media.list';
facebookMediaListAction.transports = [ActionTransport.http, ActionTransport.amqp];

module.exports = facebookMediaListAction;
