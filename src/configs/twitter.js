module.exports = {
  twitter: {
    enabled: false,
    apis: {
      userTimeline: {
        excludeReplies: false,
        includeRts: true,
      },
    },
    streamFilters: {
      replies: false,
      retweets: false,
      ignoreForFollowed: true,
    },
    notificationPolicy: {
      limitMaxAgeMs: 10000,
    },
  },
};
