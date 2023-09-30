/* eslint-disable */
// https://developer.twitter.com/en/docs/twitter-api/migrate/data-formats/standard-v1-1-to-v2
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/overview
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/tweet
// noinspection JSValidateTypes

const undici = require('undici');

function throwErrorIfFound(data) {
  if ( data.errors ) {
    throw data.errors.map(error => ({ code: error.code, message: error.message }))
  }
}

function getTweetFromGraphQL(data, id) {

  const list = data?.data?.threaded_conversation_with_injections_v2?.instructions ?? [];

  for(const instruction of list) {
    if ( instruction.type === 'TimelineAddEntries' ) {
      for(const entry of instruction.entries){
        const entryType = entry.content?.entryType;
        if ( entryType === 'TimelineTimelineItem' ) {
          const itemType = entry.content?.itemContent?.itemType;
          if ( itemType === 'TimelineTweet' ) {
            const typename = entry.content?.itemContent?.tweet_results?.result?.__typename;
            const rest_id = entry.content?.itemContent?.tweet_results?.result?.rest_id;
            if ( rest_id === id ) {
              if ( typename === "Tweet" ){
                const legacy = entry.content?.itemContent?.tweet_results?.result?.legacy;
                if ( legacy ) {
                  const user = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result?.legacy;
                  user.id_str = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result.rest_id;
                  user.id = parseInt(user.id_str);
                  return {
                    ...legacy,
                    user,
                    text: legacy.full_text,
                  };
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
            if ( user ) {
              user.id_str = tweet.core?.user_result?.result.rest_id;
              user.id = parseInt(user.id_str);
            }

            const outletTweet = {
              ...legacy,
              id_str: rest_id,
              text: legacy.full_text,
              ...( user ? { user } : {})
            };

            tweets.push(outletTweet)
          }
        } else if (typename === 'TimelineTimelineCursor') {
          const cursorType = entry.content?.cursorType;
          const value = entry.content?.value;

          if ( cursorType === "Top" ) {
            cursorTop = value
          }
          else if ( cursorType === "Bottom" ) {
            cursorBottom = value
          }
        }
      }
    }
  }

  return { tweets, cursorTop, cursorBottom }
}

async function request(config) {

  let { url, params } = config

  if ( params ) {
    const query = new URLSearchParams(params);
    url = `${url}?${query}`;
  }

  const { body, statusCode } = await undici.request(url);

  if (statusCode === 200) {
    return {
      statusCode,
      data: await body.json()
    };
  } else {
    throw new Error(`Request failed with status code: ${statusCode}`);
  }
}

async function fetchById(id) {

  const config = {
    method: 'get',
    url: process.env.NITTER_URL + '/api/tweet/' + id,
  }

  const response = await request(config);

  throwErrorIfFound(response.data);

  return getTweetFromGraphQL(response.data, id);
}

/*
  cursor || Twitter.cursor(tweet, order),
  account,
  order === 'asc' ? 'max_id' : 'since_id'
 */
async function fetchTweets(cursor, account, order) {

  const userId = await fetchUserId(account)

  const config = {
    method: 'get',
    url: process.env.NITTER_URL + '/api/user/' + userId  + '/tweets',
    params: {
      cursor
    }
  }

  const response = await request(config);

  throwErrorIfFound(response.data);

  return getTweetsFromGraphQL(response.data);
}

async function fetchUserId(username) {

  const config = {
    method: 'get',
    url: process.env.NITTER_URL + '/api/user/' + username
  }

  const response = await request(config);

  throwErrorIfFound(response.data);

  const { id } = response.data;

  return id;
}

module.exports = {
  fetchById,
  fetchTweets,
  fetchUserId
};
