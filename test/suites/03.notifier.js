const Promise = require('bluebird');
const sinon = require('sinon');
const assert = require('assert');

describe('notifier', function testSuite() {
  this.retries(20);

  const Social = require('../../src');
  const Notifier = require('../../src/services/notifier');

  before('start service', () => {
    const config = {
      ...global.SERVICES,
      notifier: {
        enabled: true,
      },
    };
    const service = this.service = new Social(config);
    return service.connect();
  });

  it('returns an instance of notifier', () => {
    const notifier = this.notifier = this.service.service(Notifier.SERVICE_NOTIFIER);
    assert(notifier instanceof Notifier);
    assert(notifier.core instanceof Social);
    assert(notifier.namespace);
    assert(notifier.config);
    assert(notifier.amqpConfig);
  });

  it('aqmp client is ready', async () => {
    await Promise.delay(1500);
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
    try {
      if (this.service !== null) {
        await this.service.close();
      }
    } catch (e) {
      // nothing
    }
  });
});
