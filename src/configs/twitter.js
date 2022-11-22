const { TweetTypes } = require('../utils/twitter');

module.exports = {
  twitter: {
    enabled: false,
    api: {
      user_timeline: {
        exclude_replies: false,
        include_rts: true,
      },
    },
    stream_filters: {
      replies: false,
      retweets: false,
      userMentions: false,
      hashTags: false,
      skipValidAccounts: false,
    },
    notifications: {
      data: ['init', 'sync'],
    },
    requests: {
      allow_types: [ // all types by default
        TweetTypes.REPLY,
        TweetTypes.RETWEET,
        TweetTypes.USER_MENTIONS,
        TweetTypes.HASHTAGS,
      ],
    },
  },
};
