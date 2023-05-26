module.exports = {
  /**
   * @type { import('@microfleet/plugin-amqp').AMQPPluginConfig }
   */
  amqp: {
    transport: {
      connection: {
        host: 'rabbitmq',
        port: 5672,
      },
    },
  },
  /**
   * @type { import('@microfleet/plugin-router-amqp/src/types/plugin').RouterAMQPPluginConfig }
   */
  routerAmqp: {
    prefix: '',
  },
};
