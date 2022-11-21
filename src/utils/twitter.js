const { isNil } = require('lodash/isNil');
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

function collectTweetMeta(data) {
  const meta = {};
  if (isReply(data)) {
    meta.reply = 1;
  }
  if (isRetweet(data)) {
    meta.retweet = 1;
  }
  if (hasUserMentions(data)) {
    meta.userMentions = 1;
  }
  if (hasHashTags(data)) {
    meta.hashTags = 1;
  }
  return meta;
}

module.exports = {
  collectTweetMeta,
};
