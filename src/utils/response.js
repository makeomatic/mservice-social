const omit = require('lodash/omit');

const isfn = fn => typeof fn === 'function';
const TYPE_TWEET = 'tweet';
const TYPE_FEED = 'feed';
const TYPE_INSTAGRAM_MEDIA = 'instagramMedia';

function transform(object, type) {
  const response = {
    id: object.id,
    type,
    attributes: omit(object.toJSON ? object.toJSON() : object, 'id'),
  };

  return response;
}

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
    response.meta.cursor = isfn(cursor)
      ? cursor(objects)
      : objects[count - 1][cursor];
  }

  if (before) {
    response.meta.before = before;
  }

  return response;
}

function modelResponse(model, type) {
  const response = {
    data: model !== null ? transform(model, type) : null,
  };

  return response;
}

function successResponse() {
  return { meta: { status: 'success' } };
}

module.exports = {
  collectionResponse,
  modelResponse,
  successResponse,
  transform,
  TYPE_TWEET,
  TYPE_FEED,
  TYPE_INSTAGRAM_MEDIA,
};
