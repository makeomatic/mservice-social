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
      skipValidAccounts: false,
    },
  },
};
