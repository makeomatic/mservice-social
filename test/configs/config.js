const path = require("path");
module.exports = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
      },
    },
  },
  twitter: {
    enabled: true,
    api: {
      user_timeline: {
        exclude_replies: false,
        include_rts: true,
      },
    },
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET,
  },
  facebook: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
    app: {
      id: 'appId1',
      secret: 'appSecret1',
    },
  },
  feed: {},
  notifier: {
    enabled: true,
    transport: {
      exchange: 'ex.broadcast',
    },
  },
  logger: {
    debug: true,
  }
};
