require('dotenv').config();

global.SERVICES = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
      },
    },
  },
  twitter: {
    enabled: true,
    apis: {
      userTimeline: {
        excludeReplies: false,
        includeRts: false,
      },
    },
    client: {
      consumerKey: process.env.TWITTER_KEY,
      consumerSecret: process.env.TWITTER_SECRET,
      accessTokenKey: process.env.TWITTER_ACCESS_KEY,
      accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
    },
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
  },
};
