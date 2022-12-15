const merge = require('lodash/merge');
const get = require('get-value');
const { TweetType, hasHashTags, hasUserMentions } = require('./tweet-types');

const STREAM_FILTERS_DEFAULTS = {
  replies: false,
  retweets: false,
  quotes: false,
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

    logger.debug('filters config: %j', this.filterOptions);
  }

  debug(message, data) {
    this.logger.debug({ id: data.id, user: data.user.screen_name }, message);
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
      quotes,
      userMentions,
      hashTags,
      skipValidAccounts,
    } = this.filterOptions;

    // Don't filter retweets posted by the valid users
    if (skipValidAccounts && this.accountIds[data.user.id] !== undefined) {
      return false;
    }

    if (replies && tweetType === TweetType.REPLY) {
      // Keep the tweets which are replied by the user
      if (data.in_reply_to_user_id === data.user.id) {
        this.debug('keep own reply', data);
        return false;
      }
      this.debug('reply filtered', data);
      return data.id;
    }

    if (retweets && tweetType === TweetType.RETWEET) {
      // Keep the tweets which are retweeted by the user
      if (get(data.retweet, 'user.id') === data.user.id) {
        this.debug('keep own retweet', data);
        return false;
      }

      this.debug('retweet filtered', data);
      return data.id;
    }

    if (quotes && tweetType === TweetType.QUOTE) {
      this.debug('quote filtered', data);
      return data.id;
    }

    if (userMentions && hasUserMentions(data)) {
      this.debug('mentions filtered', data);
      return data.id;
    }

    if (hashTags && hasHashTags(data)) {
      this.debug('hashtag filtered', data);
      return data.id;
    }

    return false;
  }
}

module.exports = StatusFilter;
