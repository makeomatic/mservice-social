require('dotenv').config();

global.SERVICES = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
      },
    },
  },
  storage: {
    debug: false,
    client: 'pg',
    connection: {
      host: 'pg',
      user: 'postgres',
      password: '',
    },
  },
  networks: [{
    name: 'twitter',
    enabled: true,
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET,
  }, {
    name: 'facebook',
    enabled: true,
    appId: process.env.FACEBOOK_ID,
    appSecret: process.env.FACEBOOK_SECRET,
  }, {
    name: 'instagram',
    enabled: false,
    syncMediaOnStart: true,
    subscribeOnStart: true,
    // client: {
    //   id: 'client-id',
    //   secret: 'client-secret',
    // },
    subscriptions: [
      // {
      //   object: 'user',
      //   type: 'media',
      //   verifyToken: 'your-verify-token',
      //   callbackUrl: 'https://your.callback/url',
      // },
    ],
  }],
};
