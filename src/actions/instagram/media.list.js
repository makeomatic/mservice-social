const Errors = require('common-errors');
const { collectionResponse, TYPE_INSTAGRAM_MEDIA } = require('../../utils/response');

/**
 * @api {http} <prefix>.instagram.media.list Get list of media
 * @apiVersion 1.0.0
 * @apiName instagram.media.list
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../../schemas/instagram.media.list.json} apiParam
 */
function instagramMediaListAction({ params, method }) {
  const instagramService = this.service('instagram');

  if (method !== 'post' && method !== 'amqp') {
    throw new Errors.NotImplementedError('media list is only available through HTTP Post or AMQP');
  }

  return instagramService
    .media()
    .list(params)
    .then((list) => collectionResponse(list, TYPE_INSTAGRAM_MEDIA, { before: params.page.cursor }));
}

instagramMediaListAction.schema = 'instagram.media.list';
instagramMediaListAction.transports = ['http', 'amqp'];

module.exports = instagramMediaListAction;
