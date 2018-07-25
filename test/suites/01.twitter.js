const Promise = require('bluebird');
const assert = require('assert');
const merge = require('lodash/merge');

describe('twitter', function testSuite() {
  this.retries(20);

  const Social = require('../../src');
  const request = require('../helpers/request');

  const uri = {
    register: 'social.feed.register',
    list: 'social.feed.list',
    readAMQP: 'social.feed.read',
    remove: 'social.feed.remove',
    read: 'http://0.0.0.0:3000/api/social/feed/read',
  };

  const payload = {
    register: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'tjholowaychuk' },
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
    remove: {
      internal: 'test@test.ru',
      network: 'twitter',
    },

    registerFail: {},
  };

  let tweetId;

  before('start service', () => {
    const service = this.service = new Social(global.SERVICES);
    return service.connect();
  });

  after('cleanup feeds', () => this.service.knex('feeds').delete());

  it('should return error if request to register is not valid', () => {
    return this.service.amqp.publishAndWait(uri.register, payload.registerFail)
      .reflect()
      .then((response) => {
        assert(response.isRejected());
        return null;
      });
  });

  it('should register feed', () => {
    return this.service.amqp
      .publishAndWait(uri.register, payload.register, { timeout: 55000 })
      .reflect()
      .then((response) => {
        assert.doesNotThrow(() => response.value());
        return null;
      });
  });

  it('should return newly registered feed', () => {
    return this.service.amqp
      .publishAndWait(uri.list, payload.list)
      .reflect()
      .then((response) => {
        assert(response.isFulfilled());
        const body = response.value();
        assert.equal(body.data.length, 2);

        payload.register.accounts.forEach((account) => {
          assert.ok(body.data.find(x => x.attributes.meta.account === account.username));
        });

        return null;
      });
  });

  // that long?
  it('wait for stream to startup', () => Promise.delay(5000));

  it('post tweet and wait for it to arrive', (done) => {
    this.service.service('twitter').client.post(
      'statuses/update',
      { status: 'Test status' },
      (error, tweet) => {
        if (error) {
          return done(error);
        }

        tweetId = tweet.id_str;
        return done();
      }
    );
  });

  it('should have collected some tweets', () => {
    return Promise
      .delay(1500)
      .then(() => request(uri.read, merge(payload.read, { token: this.adminToken })))
      .then((response) => {
        const { body, statusCode } = response;
        assert.equal(statusCode, 200);
        assert.notEqual(body.data.length, 0);
        assert.equal(body.data[0].id, tweetId);

        return null;
      });
  });

  it('confirm amqp request to read works', () => {
    return this.service.amqp.publishAndWait(uri.readAMQP, payload.read)
      .reflect()
      .then((response) => {
        assert(response.isFulfilled());
        const body = response.value();
        assert.notEqual(body.data.length, 0);

        return null;
      });
  });

  it('remove feed', () => {
    return this.service.amqp.publishAndWait(uri.remove, payload.remove)
      .reflect()
      .then((response) => {
        assert(response.isFulfilled());
        return null;
      });
  });

  after('delete tweet', (done) => {
    this.service
      .service('twitter')
      .client
      .post(`statuses/destroy/${tweetId}`, () => done());
  });

  after('shutdown service', () => this.service.close());
});
