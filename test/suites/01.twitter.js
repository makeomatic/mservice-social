const Promise = require('bluebird');
const assert = require('assert');
const sinon = require('sinon');
const AMQPTransport = require('@microfleet/transport-amqp');
const prepareSocial = require('../../src');
const Notifier = require('../../src/services/notifier');

describe('01.twitter.js', function testSuite() {
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
        { username: Date.now().toString() },
      ],
    },

    registerValidation: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: Date.now().toString() },
        { username: 'test' },
      ],
    },

    registerCaseInsensitive: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'EvgenyPoyarkov' },
      ],
    },

    oneTweet: {
      tweetId: '20',
    },

    nonExistentTweet: {
      tweetId: '10',
    },

    invalidTweet: {
      tweetId: '123-not-number',
    },

    replyWithMentions: {
      tweetId: '788099220381335552',
    },
  };

  let service;
  let listener;
  let broadcastSpy;

  before('start service', async () => {
    service = await prepareSocial();
    await service.connect();
  });

  before('init spy for amqp.publish', async () => {
    const listenerConfig = {
      ...Notifier.getInstance(service).amqpConfig,
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
      statusCode: 404,
      message: 'User not found',
    });
  });

  it('should register feed for only valid accounts', async () => {
    await assert.rejects(service.amqp
      .publishAndWait(uri.register, payload.registerValidation), `Users lookup failed for '${payload.registerValidation.accounts[0].username}'`);
  });

  it('should register feed', async () => {
    await service.amqp
      .publishAndWait(uri.register, payload.register, { timeout: 15000 });
  });

  it('should return newly registered feed', async () => {
    const body = await service.amqp
      .publishAndWait(uri.list, payload.list);

    assert.equal(body.data.length, 2);
    payload.register.accounts.forEach((account) => {
      assert.ok(body.data.find((x) => x.attributes.meta.account === account.username));
    });
  });

  it('wait for tweet loader to complete', () => Promise.delay(15000));

  it('rejects with error if account is empty array', async () => {
    await Promise.delay(1500);

    await assert.rejects(service.amqp.publishAndWait(uri.readAMQP, { filter: { account: [] } }), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: /the "account" parameter must be a string or an array/,
    });
  });

  it('rejects with error if account is not specified', async () => {
    await Promise.delay(1500);

    await assert.rejects(service.amqp.publishAndWait(uri.readAMQP, { filter: {} }), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: /the "account" parameter must be a string or an array/,
    });
  });

  it('confirm amqp request to read works', async () => {
    const response = await service.amqp.publishAndWait(uri.readAMQP, payload.read);
    assert.notEqual(response.data.length, 0);
  });

  it('remove feed', async () => {
    await service.amqp.publishAndWait(uri.remove, payload.remove);
  });

  it('should register with case insensitive', async () => {
    const body = await service.amqp
      .publishAndWait(uri.register, payload.registerCaseInsensitive, { timeout: 15000 });

    const { username } = payload.registerCaseInsensitive.accounts[0];
    assert.strictEqual(username, 'EvgenyPoyarkov');
    assert.strictEqual(body.data[0].attributes.username, 'evgenypoyarkov');
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
    assert(data.attributes.explicit);
  });

  it('rejects with error on sync non-existing tweet', async () => {
    await assert.rejects(service.amqp.publishAndWait(uri.syncOne, payload.nonExistentTweet), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: JSON.stringify([{ code: 144, message: '_Missing: No status found with that ID.' }]),
    });
  });

  it('rejects with error on sync tweet validation', async () => {
    await assert.rejects(service.amqp.publishAndWait(uri.syncOne, payload.invalidTweet), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: /tweet.sync validation failed: data\/tweetId must match pattern/,
    });
  });

  it('responds with null if tweet model not found', async () => {
    const { data } = await service.amqp.publishAndWait(uri.getOne, payload.nonExistentTweet);
    assert.strictEqual(data, null);
  });

  it('get one tweet by id', async () => {
    const { data } = await service.amqp.publishAndWait(uri.getOne, payload.oneTweet);
    assert(data);
    assert.strictEqual(data.id, payload.oneTweet.tweetId);
    assert.strictEqual(data.type, 'tweet');
    const { text, meta, explicit } = data.attributes;
    assert.strictEqual(text, 'just setting up my twttr');
    assert(explicit);
    assert(meta.account_id, '12');
    assert(meta.account);
    assert(meta.account_name);
    assert.equal(meta.account_verified, true); // from is_blue_verified
    assert(meta.retweet_count);
    assert(meta.favorite_count);
  });

  it('get count by accounts', async () => {
    const reply = await service.amqp.publishAndWait('social.tweet.count', {
      data: [{ account: 'EvgenyPoyarkov' }, { account: 'v_aminev' }],
    });
    assert.notEqual(reply.data.length, 0);
  });

  it('rejects with error on get tweet validation', async () => {
    await assert.rejects(service.amqp.publishAndWait(uri.getOne, payload.invalidTweet), {
      name: 'HttpStatusError',
      statusCode: 400,
      message: 'tweet.get validation failed: data/tweetId must match pattern "^\\d{1,20}$"',
    });
  });

  it('compute and save tweet type', async () => {
    const { data } = await service.amqp.publishAndWait(uri.syncOne, payload.replyWithMentions);

    assert(data);
    assert.strictEqual(data.id, payload.replyWithMentions.tweetId);
    assert.strictEqual(data.type, 'tweet');

    assert.notStrictEqual(data.attributes.type, 1); // reply
  });

  after('shutdown listener', async () => {
    await listener.close();
  });

  after('shutdown service', async () => {
    await service.close();
  });
});
