module.exports = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
        port: 5672,
      },
      debug: true,
    },
  },
  redis: {
    hosts: [{
      host: 'redis-cluster',
      port: 7000,
    }],
  },
  admins: [
    {
      username: 'test@test.ru',
      password: 'megalongsuperpasswordfortest',
      firstName: 'Admin',
      lastName: 'Admin',
    },
    {
      username: 'foo@bar.ru',
      password: 'bazbazbazbazbazbaz',
      firstName: 'Foo',
      lastName: 'Bar',
    },
  ],
};
