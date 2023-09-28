/* eslint-disable */
// https://developer.twitter.com/en/docs/twitter-api/migrate/data-formats/standard-v1-1-to-v2
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/overview
// https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/tweet
const axios = require('axios');
const _ = require('lodash');

function getTweetFromGraphQL(data) {
  const list = _.get(data, "data.threaded_conversation_with_injections_v2.instructions")

  for(const instruction of list) {
    if ( instruction.type === 'TimelineAddEntries' ) {
      for(const entry of instruction.entries){
        const entryType = _.get(entry, 'content.entryType');
        if ( entryType === 'TimelineTimelineItem' ) {
          const itemType = _.get(entry, 'content.itemContent.itemType');
          if ( itemType === 'TimelineTweet' ) {
            const typename = _.get(entry, 'content.itemContent.tweet_results.result.__typename');
            if ( typename === "Tweet" ){
              const legacy = _.get(entry, 'content.itemContent.tweet_results.result.legacy');
              if ( legacy ) {
                const user = _.get(entry, 'content.itemContent.tweet_results.result.core.user_results.result.legacy');
                user.id_str = _.get(entry, 'content.itemContent.tweet_results.result.core.user_results.result.rest_id');
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
      break
    }
  }

  return null
}

function getTweetsFromGraphQL(data) {

  const list = _.get(data, 'data.user_result.result.timeline_response.timeline.instructions', []);

  const tweets = [];
  let cursorTop
  let cursorBottom

  for (const item of list) {
    if (item.__typename === 'TimelineAddEntries') {
      for (const entry of item.entries) {
        const typename = _.get(entry, 'content.__typename');

        if (typename === 'TimelineTimelineItem') {
          const tweet = _.get(entry, 'content.content.tweetResult.result');

          if (tweet?.__typename === 'Tweet') {
            const { rest_id, legacy } = tweet;

            const user = _.get(tweet, 'core.user_result.result.legacy');
            user.id_str = _.get(tweet, 'core.user_result.result.rest_id');
            user.id = parseInt(user.id_str);

            const outletTweet = {
              ...legacy,
              id_str: rest_id,
              text: legacy.full_text,
              user
            };

            tweets.push(outletTweet)
          }
        } else if (typename === 'TimelineTimelineCursor') {
          const cursorType = _.get(entry, 'content.cursorType');
          const value = _.get(entry, 'content.value');

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

async function fetchById(id) {

  const config = {
    method: 'get',
    url: process.env.NITTER_URL + '/api/tweet/' + id,
  }

  const response = await axios.request(config);

  return getTweetFromGraphQL(response.data)
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

  const response = await axios.request(config);

  return getTweetsFromGraphQL(response.data);
}

async function fetchUserId(username) {

  const config = {
    method: 'get',
    url: process.env.NITTER_URL + '/api/user/' + username
  }

  const response = await axios.request(config);

  const { id } = response.data;

  return id;
}

module.exports = {
  fetchById,
  fetchTweets,
  fetchUserId
};
