/* eslint-disable */
// https://developer.twitter.com/en/docs/twitter-api/migrate/data-formats/standard-v1-1-to-v2
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/overview
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/tweet
// noinspection JSValidateTypes

const { HttpStatusError } = require('common-errors');
const { Pool } = require('undici');
const { throwErrorIfFound, getTweetFromGraphQL, getTweetsFromGraphQL } = require('./helpers');

class NitterClient {

  constructor(options = {}) {
    this.logger = options.logger;
    this.baseUrl = options.baseUrl ?? process.env.NITTER_URL;
    this.pool = new Pool(this.baseUrl, {
      bodyTimeout: 5000,
      headersTimeout: 5000,
      connectTimeout: 5000,
    });
  }

  async _request(config) {

    let { url, params, method } = config

    if (params) {
      const query = new URLSearchParams(params);
      url = `${url}?${query}`;
    }

    const {
      statusCode,
      body
    } = await this.pool.request({
      path: url,
      method: method.toUpperCase()
    });

    if (statusCode !== 200) {
      await body.dump()
      throw new Error(`Request failed with status code: ${statusCode}, body: ${data}`);
    }

    const data = await body.text();

    return {
      statusCode,
      data: JSON.parse(data)
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

  async close() {
    await this.pool.close()
  }
}

module.exports = {
  NitterClient
};
