const assert = require('assert');
const createFeedFixture = require('../fixtures/instagram/create-feed');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');
const syncOnReconnectFixture = require('../fixtures/instagram/sync-on-reconnect');

const config = {
  instagram: {
    enabled: true,
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
        return null;
      });
  });

  it('should be able to register feed', () => {
    const params = {
      internal: 'foo@instagram.com',
      network: 'instagram',
      accounts: [{
        id: '555',
        token: '555.1',
        username: 'perchik',
      }],
    };
    const mock = sinon.mock(request);

    mock
      .expects('get')
      .withArgs({
        json: true,
        url: 'https://api.instagram.com/v1/media/1385552885716996590_555/comments?access_token=555.1',
      })
      .returns({
        data: [{
          created_time: '1280780324',
          text: 'Really amazing photo!',
          from: {
            username: 'snoopdogg',
            profile_picture: 'http://images.instagram.com/profiles/profile_16_75sq_1305612434.jpg',
            id: '1574083',
            full_name: 'Snoop Dogg',
          },
          id: '420',
        }],
      })
      .once();

    mock
      .expects('get')
      .withArgs({
        json: true,
        url: 'https://api.instagram.com/v1/media/1385552885716996589_555/comments?access_token=555.1',
      })
      .returns({
        data: [],
      })
      .once();

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
        const { data } = response.value();

        assert.equal(data.length, 1);
        mock.verify();
        mock.restore();

        return null;
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

    mock
      .expects('get')
      .withArgs({
        json: true,
        url: 'https://api.instagram.com/v1/media/1385552885716996591_555/comments?access_token=555.1',
      })
      .returns({
        data: [{
          created_time: '1280780324',
          text: 'Really amazing photo!',
          from: {
            username: 'snoopdogg',
            profile_picture: 'http://images.instagram.com/profiles/profile_16_75sq_1305612434.jpg',
            id: '1574083',
            full_name: 'Snoop Dogg',
          },
          id: '420',
        }],
      })
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

        return null;
      });
  });
});
