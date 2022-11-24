const merge = require('lodash/merge');
const get = require('get-value');
const { TweetType, hasHashTags, hasUserMentions } = require('./twitter');

const STREAM_FILTERS_DEFAULTS = {
  replies: false,
  retweets: false,
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
    this.logger = logger;
  }

  /**
   * Apply filter before saving statuses to database
   * @param {object} data - fetched tweet
   * @param {number} tweetType - computed tweet type
   * @returns {bool|number}  - False if we want to allow tweet, tweet id if we want to skip tweet, and update pointer for cursor
   */
  apply(data, tweetType) {
    const {
      replies,
      retweets,
      userMentions,
      hashTags,
      skipValidAccounts,
    } = this.filterOptions;

    // Don't filter retweets posted by the valid users
    if (skipValidAccounts && this.accountIds[data.user.id] !== undefined) {
      this.logger.debug({ id: data.id, user: data.user.screen_name }, 'filter skipped by valid acc');
      return false;
    }

    if (replies && tweetType === TweetType.REPLY) {
      // Keep the tweets which are replied by the user
      if (data.in_reply_to_user_id === data.user.id) {
        this.logger.debug({ id: data.id, user: data.user.screen_name }, 'keep own reply');
        return false;
      }
      this.logger.debug({ id: data.id, user: data.user.screen_name }, 'reply filtered');
      return data.id;
    }

    if (retweets && tweetType === TweetType.RETWEET) {
      // Keep the tweets which are retweeted by the user
      if (get(data.retweet, 'user.id') === data.user.id) {
        this.logger.debug({ id: data.id, user: data.user.screen_name }, 'keep own retweet');
        return false;
      }

      this.logger.debug({ id: data.id, user: data.user.screen_name }, 'retweet filtered');
      return data.id;
    }

    if (userMentions && hasUserMentions(data)) {
      this.logger.debug({ id: data.id, user: data.user.screen_name }, 'mentions filtered');
      return data.id;
    }

    if (hashTags && hasHashTags(data)) {
      this.logger.debug({ id: data.id, user: data.user.screen_name }, 'hashtag filtered');
      return data.id;
    }

    return false;
  }
}

module.exports = StatusFilter;
