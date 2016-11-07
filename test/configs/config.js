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
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET,
  },
  feed: {},
};
