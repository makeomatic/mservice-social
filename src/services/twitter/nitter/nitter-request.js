/* eslint-disable */
// https://developer.twitter.com/en/docs/twitter-api/migrate/data-formats/standard-v1-1-to-v2
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/overview
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/tweet
// noinspection JSValidateTypes

const { HttpStatusError } = require('common-errors');
const rp = require('request-promise');
const uuid = require('uuid');
const { throwErrorIfFound, getTweetFromGraphQL, getTweetsFromGraphQL } = require('./helpers');

class NitterClient {

  constructor(options = {}) {
    this.logger = options?.logger;
    this.baseUrl = options?.baseUrl ?? process.env.NITTER_URL;
    this.requests = new Map();
  }

  async _request(config) {
    let { url, params, method } = config;

    if (params) {
      const query = new URLSearchParams(params);
      url = `${url}?${query}`;
    }

    const id = uuid.v4().toString();
    let statusCode
    let data

    try {
      const request = rp({
        uri: `${this.baseUrl}${url}`,
        method: method.toUpperCase(),
        resolveWithFullResponse: true,
        json: true
      });

      this.requests.set(id, request);

      const response = await request;
      statusCode = response.statusCode;
      data = response.body
    } finally {
      this.requests.delete(id);
    }

    if (statusCode !== 200) {
      throw new Error(`Request failed with status code: ${statusCode}, body: ${body}`);
    }

    return {
      statusCode,
      data
    };
  }

  async fetchById(id) {
    const config = {
      method: 'get',
      url: '/api/tweet/' + id,
    }

    const response = await this._request(config);

    throwErrorIfFound(response.data);

    return getTweetFromGraphQL(response.data, id);
  }

  /*
    cursor || Twitter.cursor(tweet, order),
    account,
   */
  async fetchTweets(account, cursor) {
    const { id } = await this.fetchUserId(account)

    const config = {
      method: 'get',
      url: '/api/user/' + id + '/tweets',
      ...(cursor ? { params: { cursor } } : {})
    }

    const response = await this._request(config);

    throwErrorIfFound(response.data);

    return getTweetsFromGraphQL(response.data);
  }

  async fetchUserId(_username) {
    const config = {
      method: 'get',
      url: '/api/user/' + _username
    }

    const response = await this._request(config);

    throwErrorIfFound(response.data);

    const { id, username } = response.data;
    if (!id) {
      throw new HttpStatusError(404, `User not found`);
    }

    return { id, username }
  }

  async cancel() {
    for(const [id, req] of this.requests.entries()) {
      req.cancel();
      this.requests.delete(id);
      this.logger?.debug({ id }, 'request terminated');
    }
    this.requests.clear();
  }
}

module.exports = {
  NitterClient
};
