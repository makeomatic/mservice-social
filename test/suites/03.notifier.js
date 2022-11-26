const Promise = require('bluebird');
const is = require('is');
const sinon = require('sinon');
const assert = require('assert');

describe('notifier', function testSuite() {
  // this.retries(20);

  const Social = require('../../src');
  const Notifier = require('../../src/services/notifier');

  before('start service', () => {
    const config = {
      ...global.SERVICES,
      notifier: {
        enabled: true, // false TODO: add tests for disabled
      },
    };
    const service = this.service = new Social(config);
    return service.connect();
  });

  // it('returns null when there is no link to core service', () => {
  //   assert(Notifier.getInstance() === null);
  // });

  it.skip('returns plugin connector', () => {
    const { connect, close } = this.connector = Notifier.connector(this.service);
    assert(is.fn(connect));
    assert(is.fn(close));
  });

  it.skip('both connector and destructor return false when notifier not initialized', () => {
    const { connect, close } = this.connector;
    // const stubbedGetInstance = sinon.stub(Notifier, 'getInstance')
    //   .callsFake(() => null);

    assert(connect() === false);
    assert(close() === false);

    // stubbedGetInstance.restore();
  });

  // it('throws an error when trying to initialize connector again', () => {
  //   assert.throws(() => Notifier.connector(), Notifier.kDupInstance);
  // });

  // it('returns null when skipInitialization is set to true', () => {
  //   assert(Notifier.getInstance(true) === null);
  // });

  it('returns an instance of notifier', () => {
    const notifier = this.notifier = this.service.service(Notifier.SERVICE_NOTIFIER); // Notifier.getInstance();
    assert(notifier instanceof Notifier);
    assert(notifier.core instanceof Social);
    assert(notifier.namespace);
    assert(notifier.config);
    assert(notifier.amqpConfig);
  });

  // it('returns the same instance of notifier on each call', () => {
  //   assert(Notifier.getInstance() === this.notifier);
  // });

  it.skip('returns null when tried to call .publish when disconnected', async () => {
    assert(await this.notifier.publish() === null);
  });

  it('aqmp client is ready', async () => {
    // it('is able to connect', async () => {
    await Promise.delay(1500);
    // await this.connector.connect();
    assert(this.notifier.amqpClient);
    assert(this.service.listenerCount(Notifier.kPublishEvent) === 1);
  });

  it('add stubs for next tests...', () => {
    const { namespace, amqpClient } = this.notifier;
    const amqpClientStub = this.amqpClientStub = sinon.stub(amqpClient, 'publish');
    amqpClientStub.withArgs(`/${namespace}/test/success`).resolves(true);
    amqpClientStub.withArgs(`/${namespace}/test/failure`).rejects(new Error('should throw'));
    amqpClientStub.callThrough();
  });

  it('returns true when message is published', async () => {
    const { amqpClientStub } = this;
    const res = await this.notifier.publish('test/success');
    assert(res);
    assert(amqpClientStub.called);
  });

  it('returns false in case of error', async () => {
    const { amqpClientStub } = this;
    const res = await this.notifier.publish('test/failure');
    assert(res === false);
    assert(amqpClientStub.called);
  });

  it('is able to close', async () => {
    // await this.connector.close();
    await this.service.close();
    assert(this.service.listenerCount(Notifier.kPublishEvent) === 0);
  });

  after('close', async () => {
    // this.amqpClientStub.restore();
    try {
      // make another attempt to close a connection if one of the tests has failed

      // await this.connector.close();
      if (this.service !== null) {
        await this.service.close();
      }
    } catch (e) {
      // nothing
    } finally {
      // await this.service.close();
    }
  });
});
