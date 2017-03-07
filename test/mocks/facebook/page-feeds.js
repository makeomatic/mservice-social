const is = require('is');
const proofGenerator = require('../../../src/services/facebook/proof-generator');

function makeRequest(requestOptions) {
  const { pageId, accessToken, pageToken: requestPageToken } = requestOptions;
  const request = {
    json: true,
    url: `https://graph.facebook.com/v2.8/${pageId}/feed`,
    qs: {
      appsecret_proof: proofGenerator('appSecret1', accessToken),
      access_token: accessToken,
      fields: 'attachments,message,story,picture,link,created_time,'
        + 'likes.summary(true),shares,comments.summary(true),permalink_url',
      limit: '100',
    },
  };

  if (requestPageToken) {
    request.qs.__paging_token = requestPageToken;
  }

  return request;
}

function responseMapper(id) {
  const { pageId } = this;
  const params = is.object(id) ? id : { id };

  return {
    id: `${pageId}_${params.id}`,
    message: params.message || `Post #${params.id}`,
    created_time: params.createdTime || '2016-11-24T20:56:37+0000',
  };
}

function makeResponse(requestOptions, responseOptions) {
  const { pageId, accessToken } = requestOptions;
  const { ids, pageToken: responsePageToken } = responseOptions;
  const response = {
    data: ids.map(responseMapper, { pageId }),
  };

  if (responsePageToken) {
    response.paging = {
      next: `https://graph.facebook.com/v2.8/${pageId}/feed?access_token=${accessToken}&fields=`
        + 'attachments,message,story,picture,link,created_time,likes.summary(true),shares,'
        + `comments.summary(true),permalink_url&limit=100&__paging_token=${responsePageToken}`,
    };
  }

  return response;
}

function pageFeeds(mock, requestOptions, responseOptions) {
  return mock
    .expects('get')
    .withArgs(makeRequest(requestOptions))
    .returns(makeResponse(requestOptions, responseOptions))
    .once();
}

module.exports = pageFeeds;
