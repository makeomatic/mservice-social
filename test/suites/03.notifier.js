const sinon = require('sinon');
const is = require('is');
const assert = require('assert');
const prepareSocial = require('../../src');
const { Social } = require('../../src/social');
const Notifier = require('../../src/services/notifier');

describe('notifier', function testSuite() {
  // this.retries(20);
  let service;
  let notifier;
  let connector;
  let amqpClientStub;

  before('start service', async () => {
    const config = {
      notifier: {
        enabled: false,
      },
    };
    service = await prepareSocial(config);
    return service.connect();
  });

  it('returns plugin connector', () => {
    connector = Notifier.connector(service);
    assert(is.fn(connector.connect));
    assert(is.fn(connector.close));
  });

  it('returns an instance of notifier', () => {
    notifier = Notifier.getInstance(service);
    assert(notifier instanceof Notifier);
    assert(notifier.core instanceof Social);
    assert(notifier.namespace);
    assert(notifier.config);
    assert(notifier.amqpConfig);
  });

  it('returns the same instance of notifier on each call', () => {
    assert(Notifier.getInstance(service) === notifier);
  });

  it('returns null when tried to call .publish when disconnected', async () => {
    assert(await notifier.publish() === null);
  });

  it('is able to connect', async () => {
    await connector.connect.call(service);
    assert(service.listenerCount(Notifier.kPublishEvent) === 1);
  });

  it('add stubs for next tests...', () => {
    const { namespace, amqpClient } = notifier;
    amqpClientStub = sinon.stub(amqpClient, 'publish');
    amqpClientStub.withArgs(`/${namespace}/test/success`).resolves(true);
    amqpClientStub.withArgs(`/${namespace}/test/failure`).rejects(new Error('should throw'));
    amqpClientStub.callThrough();
  });

  it('returns true when message is published', async () => {
    const res = await notifier.publish('test/success');
    assert(res);
    assert(amqpClientStub.called);
  });

  it('returns false in case of error', async () => {
    const res = await notifier.publish('test/failure');
    assert(res === false);
    assert(amqpClientStub.called);
  });

  it('is able to close', async () => {
    await connector.close.call(service);
    assert(service.listenerCount(Notifier.kPublishEvent) === 0);
  });

  after('close', async () => {
    amqpClientStub?.restore();
    try {
      // make another attempt to close a connection if one of the tests has failed
      await connector?.close();
    } catch (e) {
      // nothing
    } finally {
      await service.close();
    }
  });
});
