module.exports = {
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
        port: 5672,
      },
    },
    router: {
      enabled: true,
    },
  },
};
