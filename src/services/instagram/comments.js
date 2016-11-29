const Promise = require('bluebird');
const request = require('request-promise');

function getCommentsUrl(mediaId, accessToken) {
  return `https://api.instagram.com/v1/media/${mediaId}/comments?access_token=${accessToken}`;
}

class Comments {
  constructor(config) {
    this.config = config;
  }

  fetch(mediaId, accessToken) {
    const options = { url: getCommentsUrl(mediaId, accessToken), json: true };

    return Promise
      .resolve(request.get(options))
      .get('data');
  }
}

module.exports = Comments;
