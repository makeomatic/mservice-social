const isNil = require('lodash/isNil');
const get = require('get-value');

function isRetweet(data) {
  return !isNil(data.retweeted_status);
}

function isReply(data) {
  const toUserId = data.in_reply_to_user_id;
  if (isNil(toUserId)) {
    return false;
  }
  return !isNil(data.in_reply_to_status_id);
}

function hasUserMentions(data) {
  const list = get(data, 'entities.user_mentions');
  return list && list.length;
}
function hasHashTags(data) {
  const list = get(data, 'entities.hashtags');
  return list && list.length;
}

function collectTweetTypes(data) {
  const types = {};
  if (isReply(data)) {
    types.reply = 1;
  }
  if (isRetweet(data)) {
    types.retweet = 1;
  }
  if (hasUserMentions(data)) {
    types.userMentions = 1;
  }
  if (hasHashTags(data)) {
    types.hashTags = 1;
  }
  return types;
}

module.exports = {
  collectTweetTypes,
};
