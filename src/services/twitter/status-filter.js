const merge = require('lodash/merge');
const get = require('get-value');
const { TweetType, hasHashTags, hasUserMentions } = require('./tweet-types');

const STREAM_FILTERS_DEFAULTS = {
  replies: false,
  retweets: false,
  quotes: false,
  threads: false,
  userMentions: false,
  hashTags: false,
  skipValidAccounts: false,
};

/**
 * @param {object} filterConfig
 * @param {Logger} logger
 */

class StatusFilter {
  constructor(filterConfig, logger) {
    this.filterOptions = merge({}, STREAM_FILTERS_DEFAULTS, filterConfig);
    this.logger = logger.child({ namespace: '@social/status-filter' });

    this.logger.debug({ ...this.filterOptions }, 'filters config');
  }

  /**
   * Apply filter before saving statuses to database
   * @param {object} data - fetched tweet
   * @param {number} tweetType - computed tweet type
   * @param {Object} accountIds - valid accounts map
   * @returns {bool|number}  - False if we want to allow tweet, tweet id if we want to skip tweet, and update pointer for cursor
   */
  apply(data, tweetType, accountIds) {
    const {
      replies,
      retweets,
      quotes,
      threads,
      userMentions,
      hashTags,
      skipValidAccounts,
    } = this.filterOptions;

    // Don't filter any type of tweets posted by the valid users
    if (skipValidAccounts && accountIds[data.user.id_str] !== undefined) {
      return false;
    }

    if (replies && tweetType === TweetType.REPLY) {
      // Keep the tweets which are replied by the user
      if (threads === false && data.in_reply_to_user_id_str === data.user.id_str) {
        this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'keep own reply');
        return false;
      }
      this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'filter reply');
      return data.id_str;
    }

    if (retweets && tweetType === TweetType.RETWEET) {
      // Keep the tweets which are retweeted by the user
      if (threads === false && get(data.retweeted_status, 'user.id_str') === data.user.id_str) {
        this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'keep own retweet');
        return false;
      }

      this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'filter retweet');

      return data.id_str;
    }

    if (quotes && tweetType === TweetType.QUOTE) {
      this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'filter quote');
      return data.id_str;
    }

    if (userMentions && hasUserMentions(data)) {
      this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'filter mentions');
      return data.id_str;
    }

    if (hashTags && hasHashTags(data)) {
      this.logger.debug({ id: data.id_str, user: data.user.screen_name }, 'filter hashtag');
      return data.id_str;
    }

    return false;
  }
}

module.exports = StatusFilter;
