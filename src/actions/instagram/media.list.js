/**
 * @api {http} <prefix>.instagram.media.list Get list of media
 * @apiVersion 1.0.0
 * @apiName instagram.media.list
 * @apiGroup Instagram
 * @apiSchema {jsonschema=../../../schemas/instagram.media.list.json} apiParam
 */
function instagramMediaListAction({ params }) {
  const instagramService = this.getService('instagram');

  return instagramService.mediaList(params);
}

instagramMediaListAction.schema = 'instagram.media.list';
instagramMediaListAction.transports = ['amqp'];

module.exports = instagramMediaListAction;
