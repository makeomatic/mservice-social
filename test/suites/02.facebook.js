const assert = require('assert');
const merge = require('lodash/merge');

describe('facebook', function testSuite() {
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
      network: 'facebook',
      filter: {
        accounts: [
          {
            id: 'fuwaneko',
            // eslint-disable-next-line
            access_token: process.env.FACEBOOK_TEST_TOKEN
          },
        ],
      },
    },
    list: {
      filter: {
        internal: 'test@test.ru',
      },
    },
    read: {
      filter: {
        account: 'fuwaneko',
      },
    },
    remove: {
      internal: 'test@test.ru',
      network: 'facebook',
    },

    registerFail: {},
  };

  let tweetId;

  before('start service', () => {
    const service = this.service = new Social(global.SERVICES);
    return service.connect();
  });

  it('should return error if request to register is not valid', () => {
    return this.service.amqp.publishAndWait(uri.register, payload.registerFail)
      .reflect()
      .then((response) => {
        assert(response.isRejected());
      });
  });

  it('should register feed', () => {
    return this.service.amqp
      .publishAndWait(uri.register, payload.register, { timeout: 55000 })
      .reflect()
      .then((response) => {
        assert.doesNotThrow(() => response.value());
      });
  });

  it('should return newly registered feed', () => {
    return this.service.amqp
      .publishAndWait(uri.list, payload.list)
      .reflect()
      .then((response) => {
        assert(response.isFulfilled());
        const body = response.value();
        assert.notEqual(body.data.length, 0);
        assert.equal(body.data[0].id, 1);
      });
  });

  it('should have collected some posts', () => {
    return request(uri.read, merge(payload.read, { token: this.adminToken }))
      .then((response) => {
        const { body, statusCode } = response;
        assert.equal(statusCode, 200);
        assert.notEqual(body.data.length, 0);
        assert.equal(body.data[0].id, tweetId);
      });
  });

  it('confirm amqp request to read works', () => {
    return this.service.amqp.publishAndWait(uri.readAMQP, payload.read)
      .reflect()
      .then((response) => {
        assert(response.isFulfilled());
        const body = response.value();
        assert.notEqual(body.data.length, 0);
      });
  });

  it('remove feed', () => {
    return this.service.amqp.publishAndWait(uri.remove, payload.remove)
      .reflect()
      .then((response) => {
        assert(response.isFulfilled());
      });
  });

  after('shutdown service', () => this.service.close());
});
