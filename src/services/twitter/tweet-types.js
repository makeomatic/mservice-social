const isNil = require('lodash/isNil');
const get = require('get-value');
const { conforms, isObject, isString } = require('lodash');

const TweetType = {
  ORIGINAL: 0,
  REPLY: 1,
  RETWEET: 2,
  QUOTE: 3,
};

const TweetTypeByName = {
  tweet: TweetType.ORIGINAL,
  reply: TweetType.REPLY,
  retweet: TweetType.RETWEET,
  quote: TweetType.QUOTE,
};

/**
 * @returns {boolean}
 */
const isTweet = (data) => conforms({
  entities: isObject,
  id_str: isString,
  text: isString,
})(data);

// https://developer.twitter.com/en/docs/tutorials/determining-tweet-types
const isReply = (data) => !isNil(data.in_reply_to_status_id) || !isNil(data.in_reply_to_user_id);
const isRetweet = (data) => !isNil(data.retweeted_status);
const isQuote = (data) => data.is_quote_status === true;

function getTweetType(data) {
  if (isReply(data)) {
    return TweetType.REPLY;
  }

  if (isRetweet(data)) {
    return TweetType.RETWEET;
  }

  if (isQuote(data)) {
    return TweetType.QUOTE;
  }

  return TweetType.ORIGINAL;
}

function hasUserMentions(data) {
  const list = get(data, 'entities.user_mentions');
  return list && list.length;
}
function hasHashTags(data) {
  const list = get(data, 'entities.hashtags');
  return list && list.length;
}

module.exports = {
  isTweet,
  TweetType,
  TweetTypeByName,
  getTweetType,
  hasHashTags,
  hasUserMentions,
};
