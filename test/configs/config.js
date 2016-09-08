global.SERVICES = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
      },
    },
  },
  storage: {
    connection: {
      host: 'pg',
      user: 'postgres',
      password: '',
    },
  },
  twitter: {},
  feed: {},
};
