const { collectionResponse, TYPE_INSTAGRAM_MEDIA } = require('../../utils/response');

/**
 * @api {http} <prefix>.instagram.media.list Get list of media
 * @apiVersion 1.0.0
 * @apiName instagram.media.list
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../../schemas/instagram.media.list.json} apiParam
 */
function instagramMediaListAction({ params }) {
  const instagramService = this.getService('instagram');

  return instagramService
    .mediaList(params)
    .then(list => collectionResponse(list, TYPE_INSTAGRAM_MEDIA, { before: params.page.cursor }));
}

instagramMediaListAction.schema = 'instagram.media.list';
instagramMediaListAction.transports = ['amqp'];

module.exports = instagramMediaListAction;
