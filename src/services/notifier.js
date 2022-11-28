const assert = require('assert');
const AMQPTransport = require('@microfleet/transport-amqp');

class Notifier {
  static connector(core) {
    assert(core.config.notifier.enabled, 'connect disabled notifier');

    core.service(Notifier.SERVICE_NOTIFIER, new Notifier(core));

    function connect() {
      const instance = core.service(Notifier.SERVICE_NOTIFIER);

      if (instance) {
        return instance.connect();
      }

      return false;
    }

    function close() {
      const instance = core.service(Notifier.SERVICE_NOTIFIER);

      if (instance) {
        return instance.close();
      }

      return false;
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
    this.enabled = config.notifier.enabled;
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
    this.core.on(Notifier.kPublishEvent, this.publish);
  }

  async close() {
    this.core.off(Notifier.kPublishEvent, this.publish);

    if (this.amqpClient) {
      await this.amqpClient.close();
    }
  }

  async publish(route, data) {
    if (!this.amqpClient) {
      return null;
    }

    try {
      this.log.debug('publishing %j to %s', data, `/${this.namespace}/${route}`);
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

Notifier.kPublishEvent = Symbol('notifier::onpublish');
Notifier.SERVICE_NOTIFIER = 'notifier';

module.exports = Notifier;
