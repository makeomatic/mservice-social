const AMQPTransport = require('@microfleet/transport-amqp');

const kInstance = Symbol('notifier');
const kPublishEvent = Symbol('notifier::onpublish');
class Notifier {
  static getInstance(core) {
    return core[kInstance];
  }

  static connector(core) {
    if (!core[kInstance]) {
      core[kInstance] = new Notifier(core);
    }

    async function connect() {
      await this[kInstance].connect();
    }

    async function close() {
      await this[kInstance].close();
    }

    return {
      connect,
      close,
    };
  }

  constructor(core) {
    const { log, config } = core;

    this.log = log.child({ namespace: '@social/notifier' });
    this.core = core;
    this.config = config.notifier;
    this.amqpConfig = {
      ...config.amqp.transport,
      ...config.notifier.transport,
      listen: undefined,
    };

    // use the defined microservice prefix as a namespace for publications to the exchange
    this.namespace = config.router.routes.prefix;
    this.publish = this.publish.bind(this);
  }

  async connect() {
    this.amqpClient = await AMQPTransport.connect(this.amqpConfig);
    this.core.on(kPublishEvent, this.publish);
  }

  async close() {
    this.core.off(kPublishEvent, this.publish);

    if (this.amqpClient) {
      await this.amqpClient.close();
    }
  }

  async publish(route, data) {
    if (!this.amqpClient) {
      return null;
    }

    try {
      this.log.debug('publishing %s', `/${this.namespace}/${route}`);
      // Post notification to a fanout exchange
      await this.amqpClient.publish(`/${this.namespace}/${route}`, data, {
        confirm: true,
      });
      return true;
    } catch (e) {
      this.log.error('could not pubslish a notification to %s due to %j', route, e);
      return false;
    }
  }
}

module.exports = Notifier;
module.exports.kPublishEvent = kPublishEvent;
