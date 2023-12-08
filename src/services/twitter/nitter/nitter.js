/* eslint-disable */
// https://developer.twitter.com/en/docs/twitter-api/migrate/data-formats/standard-v1-1-to-v2
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/overview
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/tweet
// noinspection JSValidateTypes

const { HttpStatusError } = require('common-errors');
const { Pool } = require('undici');

// const axios = require('axios');

function throwErrorIfFound(data) {
  if (data.errors) {
    throw data.errors.map(error => ({ code: error.code, message: error.message }))
  }
}

function setInReplyTo(legacy) {
  if (legacy.in_reply_to_status_id_str) {
    legacy.in_reply_to_status_id = parseInt(legacy.in_reply_to_status_id_str)
  }
  if (legacy.in_reply_to_user_id_str) {
    legacy.in_reply_to_user_id = parseInt(legacy.in_reply_to_user_id_str)
  }
}

function setRetweetedStatus(legacy) {
  const retweet = legacy.retweeted_status_result?.result?.legacy
  if (retweet) {
    const retweetId = legacy.retweeted_status_result?.result?.rest_id

    let user = legacy.retweeted_status_result?.result?.core?.user_results?.result?.legacy;
    if (user) {
      user.id_str = legacy.retweeted_status_result?.result?.core?.user_results?.result.rest_id;
      user.id = parseInt(user.id_str);
    }

    if (!user) {
      user = legacy.retweeted_status_result?.result?.core?.user_result?.result?.legacy;
      if (user) {
        user.id_str = legacy.retweeted_status_result?.result?.core?.user_result?.result?.rest_id;
        user.id = parseInt(user.id_str);
      }
    }

    if (user) {
      legacy.retweeted_status = {
        ...retweet,
        id: parseInt(retweetId),
        id_str: retweetId,
        user
      }
    }
  }
}

function getTweetFromGraphQL(data, id) {

  const list = data?.data?.threaded_conversation_with_injections_v2?.instructions ?? [];

  for (const instruction of list) {
    if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries) {
        const entryType = entry.content?.entryType;
        if (entryType === 'TimelineTimelineItem') {
          const itemType = entry.content?.itemContent?.itemType;
          if (itemType === 'TimelineTweet') {
            const typename = entry.content?.itemContent?.tweet_results?.result?.__typename;
            const rest_id = entry.content?.itemContent?.tweet_results?.result?.rest_id;
            if (rest_id === id) {
              if (typename === "Tweet") {
                const legacy = entry.content?.itemContent?.tweet_results?.result?.legacy;
                if (legacy) {
                  setRetweetedStatus(legacy)
                  setInReplyTo(legacy)

                  const user = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result?.legacy;
                  user.id_str = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result.rest_id;
                  user.id = parseInt(user.id_str);

                  return {
                    ...legacy,
                    id: parseInt(rest_id),
                    id_str: rest_id,
                    user,
                    text: legacy.full_text
                  }
                }
              }
            }
          }
        }
      }
      break
    }
  }

  return null
}

function getTweetsFromGraphQL(data) {

  const list = data?.data?.user_result?.result?.timeline_response?.timeline?.instructions ?? [];

  const tweets = [];
  let cursorTop
  let cursorBottom

  for (const item of list) {
    if (item.__typename === 'TimelineAddEntries') {
      for (const entry of item.entries) {
        const typename = entry.content?.__typename;

        if (typename === 'TimelineTimelineItem') {
          const tweet = entry.content?.content?.tweetResult?.result;

          if (tweet?.__typename === 'Tweet') {
            const { rest_id, legacy } = tweet;

            const user = tweet.core?.user_result?.result?.legacy;
            user.id_str = tweet.core?.user_result?.result.rest_id;
            user.id = parseInt(user.id_str);

            setRetweetedStatus(legacy)
            setInReplyTo(legacy)

            const outletTweet = {
              ...legacy,
              id: parseInt(rest_id),
              id_str: rest_id,
              text: legacy.full_text,
              user,
            };

            tweets.push(outletTweet)
          }
        } else if (typename === 'TimelineTimelineCursor') {
          const cursorType = entry.content?.cursorType;
          const value = entry.content?.value;

          if (cursorType === "Top") {
            cursorTop = value
          } else if (cursorType === "Bottom") {
            cursorBottom = value
          }
        }
      }
    }
  }

  return { tweets, cursorTop, cursorBottom }
}

class NitterClient {

  constructor(options = {}) {
    this.baseUrl = options?.baseUrl ?? process.env.NITTER_URL;
    this.pool = new Pool(this.baseUrl, {
      connections: options?.connections ?? 5,
      pipelining: 1,
      bodyTimeout: 5000,
      headersTimeout: 5000
    });
  }

  async _request(config) {

    let { url, params, method } = config

    if (params) {
      const query = new URLSearchParams(params);
      url = `${url}?${query}`;
    }

    // const response = await axios.request({ url, baseURL: this.baseUrl, params, method, timeout: 5000 })
    // const statusCode = response.status
    //
    // if (statusCode === 200) {
    //   return {
    //     statusCode,
    //     data: response.data
    //   };
    // } else {
    //   throw new Error(`Request failed with status code: ${statusCode}, body: ${ response.data }`);
    // }

    const { body, statusCode } = await this.pool.request({ path: url, method: method.toUpperCase() });

    if (statusCode === 200) {
      return {
        statusCode,
        data: await body.json()
      };
    } else {
      throw new Error(`Request failed with status code: ${statusCode}, body: ${await body.text()}`);
    }
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
    order === 'asc' ? 'max_id' : 'since_id'
   */
  async fetchTweets(cursor, account, order) {

    const { id } = await this.fetchUserId(account)

    const config = {
      method: 'get',
      url: '/api/user/' + id + '/tweets',
      params: {
        cursor
      }
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
    if (id === "") {
      throw new HttpStatusError(404, "User not found");
    }

    return { id, username }
  }

  async destroy() {
    if (this.pool) {
      await this.pool.destroy();
      this.pool = undefined;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.close();
      this.pool = undefined;
    }
  }
}

module.exports = {
  NitterClient
};
