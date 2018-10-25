const AMQPTransport = require('@microfleet/transport-amqp');

class Notifier {
  /* eslint-disable lines-between-class-members */
  static kInstance = Symbol('notifier');
  static kPublish = Symbol('notifier::onpublish')
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
    if (Notifier.microfleet) {
      throw new Error('Notifier has been already initialized');
    }

    Notifier.microfleet = core;

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

    return {
      connect,
      close,
    };
  }

  constructor(core) {
    const { log, config } = core;

    this.log = log;
    this.core = core;
    this.config = config.notifier;
    this.amqpConfig = {
      ...config.amqp.transport,
      ...config.notifier.transport,
    };
  }

  async connect() {
    this.amqp = await AMQPTransport.connect(this.amqpConfig);
    this.core.on(Notifier.kPublish, this.publish);
  }

  async close() {
    this.core.off(Notifier.kPublish, this.publish);

    if (this.amqp) {
      await this.amqp.close();
    }
  }

  publish = async (route, data) => {
    if (!this.amqp) {
      return;
    }

    try {
      const { prefix } = this.core.config.router.routes;

      this.log.debug('publishing %j to %s', data, route);
      await this.amqp.publish(`/${prefix}/${route}`, data, {
        confirm: true,
      });
    } catch (e) {
      this.log.error('could not pubslish a notification to %s due to %j', route, e);
    }
  }
}

module.exports = Notifier;
