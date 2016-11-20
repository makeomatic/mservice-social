const { omit, isFunction } = require('lodash');

const transform = (object, type) => ({
  id: object.id,
  type,
  attributes: omit(object.toJSON ? object.toJSON() : object, 'id'),
});

const modelResponse = (model, type) => ({ data: model !== null ? transform(model, type) : null });
const successResponse = () => ({ meta: { status: 'success' } });

function collectionResponse(objects, type, options = {}) {
  const { before } = options;
  const count = objects.length;
  const total = parseInt(objects[0].total, 10) || 0;
  const cursor = options.cursor || 'id';
  const response = {
    meta: {
      count,
      total,
    },
    data: objects.map(object => transform(object, type)),
  };

  if (count) {
    response.meta.cursor = isFunction(cursor)
      ? cursor(objects)
      : objects[count - 1][cursor];
  }

  if (before) {
    response.meta.before = before;
  }

  return response;
}

module.exports = {
  collectionResponse,
  modelResponse,
  successResponse,
  transform,
  TYPE_FEED: 'feed',
  TYPE_TWEET: 'tweet',
  TYPE_FACEBOOK_STATUS: 'facebook_status',
  TYPE_INSTAGRAM_MEDIA: 'instagram_media',
};
