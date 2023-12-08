module.exports = {
  twitter: {
    enabled: false,
    max_pages: 20,
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
      threads: false,
      userMentions: false,
      hashTags: false,
      skipValidAccounts: false,
    },
    notifications: {
      data: ['init', 'sync'],
    },
    requests: {
      restrictedTypes: [
        // tweet | reply | retweet | quote
      ],
    },
  },
};
