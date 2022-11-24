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
      quotes: false,
      userMentions: false,
      hashTags: false,
      skipValidAccounts: false,
    },
    notifications: {
      data: ['init', 'sync'],
    },
    requests: {
      restricted_types: [], // tweet | reply | retweet | quote
    },
  },
};
