const assert = require('assert');
const merge = require('lodash/merge');
const fb = require('fbgraph');
const Promise = require('bluebird');

const post = Promise.promisify(fb.post);

describe('facebook', function testSuite() {
  const Social = require('../../src');
  const request = require('../helpers/request');

  const uri = {
    register: 'social.feed.register',
    list: 'social.feed.list',
    readAMQP: 'social.feed.read',
    remove: 'social.feed.remove',
    webhook: 'http://0.0.0.0:3000/api/social/facebook/webhook',
    read: 'http://0.0.0.0:3000/api/social/feed/read',
  };

  const payload = {
    register: {
      internal: 'test@test.ru',
      network: 'facebook',
      filter: {
        accounts: [
          {
            id: process.env.FACEBOOK_TEST_ACCOUNT,
            username: process.env.FACEBOOK_TEST_ACCOUNT_NAME,
            access_token: process.env.FACEBOOK_TEST_TOKEN,
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
        account: process.env.FACEBOOK_TEST_ACCOUNT_NAME,
        network: 'facebook',
      },
    },
    remove: {
      internal: 'test@test.ru',
      network: 'facebook',
    },

    registerFail: {},
  };

  const webhookParams = {
    entry: [{
      changed_fields: ['feed'],
      id: process.env.FACEBOOK_TEST_ACCOUNT,
      time: Date.now(),
    }],
    object: 'user',
  };

  let postCount;

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
        postCount = body.data.length;
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

  it('post something on facebook', () => {
    const params = {
      message: `Test message from ${Date.now()}`,
    };
    return post(`/me/feed?access_token=${process.env.FACEBOOK_TEST_TOKEN}`, params);
  });

  it('manually call webhook', () => {
    return request(uri.webhook, webhookParams)
      .then((response) => {
        const { body, statusCode } = response;
        assert.equal(statusCode, 200);
        assert.notEqual(body.data, 0);
      });
  });

  it('should have more statuses than before', () => {
    return request(uri.read, merge(payload.read, { token: this.adminToken }))
      .then((response) => {
        const { body, statusCode } = response;
        assert.equal(statusCode, 200);
        assert.notEqual(body.data.length, 0);
        assert.notEqual(body.data.length, postCount);
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
