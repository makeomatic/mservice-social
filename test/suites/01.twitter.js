const Promise = require('bluebird');
const assert = require('assert');
const sinon = require('sinon');
const AMQPTransport = require('@microfleet/transport-amqp');

describe('twitter', function testSuite() {
  this.retries(20);

  const Social = require('../../src');
  const Notifier = require('../../src/services/notifier');
  const request = require('../helpers/request');

  const uri = {
    register: 'social.feed.register',
    list: 'social.feed.list',
    readAMQP: 'social.feed.read',
    remove: 'social.feed.remove',
    read: 'http://0.0.0.0:3000/api/social/feed/read',
    syncOne: 'social.tweet.sync',
    getOne: 'social.tweet.get',
  };

  const payload = {
    register: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'evgenypoyarkov' },
        { id: '2533316504', username: 'v_aminev' },
      ],
    },
    list: {
      filter: {
        internal: 'test@test.ru',
      },
    },
    read: {
      filter: {
        account: 'v_aminev',
      },
    },
    readMultiple: {
      filter: {
        account: ['EvgenyPoyarkov', 'v_aminev'],
      },
    },
    remove: {
      internal: 'test@test.ru',
      network: 'twitter',
    },

    registerFail: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'undefined' },
      ],
    },

    registerValidation: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'undefined' },
        { username: 'test' },
      ],
    },

    registerCaseInsensitive: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'streamlayer' },
      ],
    },

    oneTweet: {
      tweetId: '20',
    },

    invalidTweet: {
      tweetId: 'not-numerical-id',
    },
  };

  let tweetId;
  let service;
  let listener;
  let broadcastSpy;

  before('start service', async () => {
    service = new Social(global.SERVICES);
    await service.connect();
  });

  before('init spy for amqp.publish', async () => {
    const listenerConfig = {
      ...Notifier.getInstance().amqpConfig,
      listen: '*',
      queue: 'test',
      exchangeArgs: {
        type: 'fanout',
      },
    };

    broadcastSpy = sinon.spy();
    listener = await AMQPTransport.connect(listenerConfig, (message, amqp) => {
      const { account } = message.attributes.meta;
      assert(account);
      assert(amqp.routingKey === `/social/twitter/subscription/${account}`);
      broadcastSpy(message);
    });
  });

  after('cleanup feeds', () => service.knex('feeds').delete());

  it('should return error if request to register is not valid', async () => {
    await assert.rejects(service.amqp.publishAndWait(uri.register, payload.registerFail), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: JSON.stringify([{ code: 17, message: 'No user matches for specified terms.' }]),
    });
  });

  it('should register feed for only valid accounts', async () => {
    await assert.rejects(service.amqp
      .publishAndWait(uri.register, payload.registerValidation), /Users lookup failed for 'undefined'/);
  });

  it('should register feed', async () => {
    await service.amqp
      .publishAndWait(uri.register, payload.register, { timeout: 15000 });
  });

  it('should register with case insensitive', async () => {
    const body = await service.amqp
      .publishAndWait(uri.register, payload.registerCaseInsensitive, { timeout: 15000 });

    const { username: requested } = payload.registerCaseInsensitive.accounts[0];
    assert.strictEqual(requested, 'streamlayer');
    assert.strictEqual(body.data[0].attributes.username, 'StreamLayer');
  });

  it('should return newly registered feed', async () => {
    const body = await service.amqp
      .publishAndWait(uri.list, payload.list);

    assert.equal(body.data.length, 2);
    payload.register.accounts.forEach((account) => {
      assert.ok(body.data.find((x) => x.attributes.meta.account === account.username));
    });
  });

  // that long?
  it('wait for stream to startup', () => Promise.delay(5000));

  it('post tweet and wait for it to arrive', (done) => {
    service.service('twitter').client.post(
      'statuses/update',
      { status: 'Test status' },
      (error, tweet) => {
        if (error) {
          if (Array.isArray(error)) {
            return done(new Error(JSON.stringify(error)));
          }

          return done(error);
        }

        tweetId = tweet.id_str;
        return done();
      }
    );
  });

  it('should have collected some tweets', async () => {
    await Promise.delay(1500);
    const response = await request(uri.read, payload.read);

    const { body, statusCode } = response;
    assert.equal(statusCode, 200);
    assert.notEqual(body.data.length, 0);
    assert.equal(body.data[0].id, tweetId);
    assert(broadcastSpy.getCalls().find((call) => {
      return call.args[0].id === tweetId;
    }));
  });

  it('should have collected some tweets', async () => {
    await Promise.delay(1500);
    const response = await request(uri.read, payload.readMultiple);

    const { body, statusCode } = response;
    assert.equal(statusCode, 200);
    assert.notEqual(body.data.length, 0);
    assert.equal(body.data[0].id, tweetId);
    assert(broadcastSpy.getCalls().find((call) => {
      return call.args[0].id === tweetId;
    }));
  });

  it('verify that spy has been called', () => {
    assert(broadcastSpy.called);
  });

  it('confirm amqp request to read works', async () => {
    const response = await service.amqp.publishAndWait(uri.readAMQP, payload.read);
    assert.notEqual(response.data.length, 0);
  });

  it('remove feed', async () => {
    await service.amqp.publishAndWait(uri.remove, payload.remove);
  });

  after('delete tweet', (done) => {
    service
      .service('twitter')
      .client
      .post(`statuses/destroy/${tweetId}`, () => done());
  });

  it('sync one tweet by id', async () => {
    const { data } = await service.amqp.publishAndWait(uri.syncOne, payload.oneTweet);
    assert(data);
    assert.strictEqual(data.id, payload.oneTweet.tweetId);
    assert.strictEqual(data.type, 'tweet');

    const { text, account, meta } = data.attributes;
    assert.strictEqual(account, 'jack');
    assert.strictEqual(text, 'just setting up my twttr');
    assert(meta);
    assert.strictEqual(meta.id_str, payload.oneTweet.tweetId);
  });

  it('reject with error on sync with incorrect id', async () => {
    assert.rejects(service.amqp.publishAndWait(uri.syncOne, payload.invalidTweet), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: JSON.stringify([{ code: 8, message: 'No data available for specified ID.' }]),
    });
  });

  it('get one tweet by id', async () => {
    const { data } = await service.amqp.publishAndWait(uri.getOne, payload.oneTweet);
    assert(data);
    assert.strictEqual(data.id, payload.oneTweet.tweetId);
    assert.strictEqual(data.type, 'tweet');
    const { text, meta } = data.attributes;
    assert.strictEqual(text, 'just setting up my twttr');
    assert(meta.account_id, '12');
    assert(meta.account);
    assert(meta.account_name);
    assert(meta.account_verified);
    assert(meta.retweet_count);
    assert(meta.favorite_count);
  });

  after('close consumer', () => listener.close());
  after('shutdown service', () => service.close());
});
