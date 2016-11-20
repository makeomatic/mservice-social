const assert = require('assert');
const createFeedFixture = require('../fixtures/instagram/create-feed');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');
const syncOnReconnectFixture = require('../fixtures/instagram/sync-on-reconnect');

const config = {
  networks: [
    {
      name: 'instagram',
      enabled: true,
      syncMediaOnStart: true,
      subscribeOnStart: true,
      client: {
        id: 'client-id',
        secret: 'client-secret',
      },
      subscriptions: [
        {
          object: 'user',
          type: 'media',
          verifyToken: 'your-verify-token',
          callbackUrl: 'https://your.callback/url',
        },
      ],
    },
  ],
};

describe('instagram', function testSuite() {
  after('clean instagram_media', () => this.service.knex('instagram_media').delete());
  after('clean feeds', () => this.service.knex('feeds').delete());
  after('shutdown service', () => this.service.close());

  it('should be able to subscribe on start up', () => {
    const response = Promise.resolve({
      meta: { code: 200 },
      data: {
        object: 'user',
        object_id: null,
        aspect: 'media',
        subscription_id: 0,
        callback_url: 'https://your.callback/url',
        type: 'subscription',
        id: 0,
      },
    });
    const requestParams = {
      url: 'https://api.instagram.com/v1/subscriptions/',
      formData: {
        object: 'user',
        type: 'media',
        verify_token: 'your-verify-token',
        callback_url: 'https://your.callback/url',
        client_id: 'client-id',
        client_secret: 'client-secret',
      },
    };
    const mock = sinon.mock(request);
    const service = this.service = new Social(config);

    mock.expects('post').once().withArgs(requestParams).returns(response);

    return service
      .connect()
      .then(() => {
        mock.verify();
        mock.restore();
      });
  });

  it('should be able to register feed', () => {
    const params = {
      internal: 'foo@instagram.com',
      network: 'instagram',
      filter: {
        accounts: [{
          id: '555',
          access_token: '555.1',
          username: 'perchik',
        }],
      },
    };
    const mock = sinon.mock(request);

    mock
      .expects('get')
      .withArgs(createFeedFixture.request.first)
      .returns(createFeedFixture.response.first)
      .once();
    mock
      .expects('get')
      .withArgs(createFeedFixture.request.second)
      .returns(createFeedFixture.response.second)
      .once();

    return this.service.amqp
      .publishAndWait('social.feed.register', params)
      .reflect()
      .then((response) => {
        const data = response.value();

        assert.deepEqual(data, { accounts: 1 });
        mock.verify();
        mock.restore();
      });
  });

  it('should be able to synchronize media on reconnect', () => {
    const mock = sinon.mock(request);
    const response = Promise.resolve({
      meta: { code: 200 },
      data: {
        object: 'user',
        object_id: null,
        aspect: 'media',
        subscription_id: 0,
        callback_url: 'https://your.callback/url',
        type: 'subscription',
        id: 0,
      },
    });
    const requestParams = {
      url: 'https://api.instagram.com/v1/subscriptions/',
      formData: {
        object: 'user',
        type: 'media',
        verify_token: 'your-verify-token',
        callback_url: 'https://your.callback/url',
        client_id: 'client-id',
        client_secret: 'client-secret',
      },
    };

    mock.expects('post').once().withArgs(requestParams).returns(response);
    mock
      .expects('get')
      .withArgs(syncOnReconnectFixture.request)
      .returns(syncOnReconnectFixture.response)
      .once();

    return this.service
      .close()
      .then(() => {
        const service = this.service = new Social(config);

        return service.connect();
      })
      .then(() => {
        mock.verify();
        mock.restore();
      });
  });
});
