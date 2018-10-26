const assert = require('assert');
const AMQPTransport = require('@microfleet/transport-amqp');
const { HttpStatusError } = require('common-errors');

class Notifier {
  /* eslint-disable lines-between-class-members */
  static kDupInstance = new HttpStatusError(409, 'Notifier has been already initialized');
  static kInstance = Symbol('notifier');
  static kPublishEvent = Symbol('notifier::onpublish')
  static microfleet = null;
  /* eslint-enable */

  static getInstance(skipInitialization = false) {
    const { microfleet } = Notifier;

    if (!microfleet) {
      return null;
    }

    try {
      return microfleet.service(Notifier.kInstance);
    } catch (e) {
      if (skipInitialization) {
        return null;
      }
      return microfleet.service(Notifier.kInstance, new Notifier(microfleet));
    }
  }

  static connector(core) {
    assert(Notifier.microfleet === null, Notifier.kDupInstance);

    function connect() {
      const instance = Notifier.getInstance();

      if (instance) {
        return instance.connect();
      }

      return false;
    }

    function close() {
      const instance = Notifier.getInstance(true);

      if (instance) {
        return instance.close();
      }

      return false;
    }

    // store the link to the parent service
    Notifier.microfleet = core;

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
    };

    // use the defined microservice prefix as a namespace for publications to the exchange
    this.namespace = config.router.routes.prefix;
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

  publish = async (route, data) => {
    if (!this.amqpClient) {
      return null;
    }

    try {
      this.log.debug('publishing %j to %s', data, route);
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
