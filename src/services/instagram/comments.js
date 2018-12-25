function getCommentsUrl(mediaId, accessToken) {
  return `https://api.instagram.com/v1/media/${mediaId}/comments?access_token=${accessToken}`;
}

class Comments {
  constructor(instagram) {
    this.instagram = instagram;
    this.config = instagram.config;
  }

  // eslint-disable-next-line class-methods-use-this
  fetch(mediaId, accessToken) {
    const options = { url: getCommentsUrl(mediaId, accessToken), json: true };

    return this.instagram
      .request(options, accessToken)
      .get('data');
  }
}

module.exports = Comments;
