const assert = require('assert');
const getMediaResponse = require('../fixtures/instagram/get-media-response');
const feedFactory = require('../fixtures/instagram/feed');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');
const subcriptionRequest = require('../fixtures/instagram/subscription-request');

const http = request.defaults({
  uri: 'http://localhost:3000/api/social/instagram/webhook',
  simple: false,
  resolveWithFullResponse: true,
  json: true,
});

const config = {
  networks: [{
    name: 'instagram',
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
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
  }],
};
const service = new Social(config);

describe('instagram.webhook', function testSuite() {
  before('start up service', () => service.connect());
  after('shutdown service', () => service.close());

  it('http: should be able to return error if invalid verification token', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.challenge': '15f7d1a91c1f40f8a748fd134752feb3',
      'hub.verify_token': 'invalid-verify-token',
    };

    return http({ qs: params }).then((response) => {
      assert.equal(response.statusCode, 403);
      assert.equal(response.body.message, 'An attempt was made to perform an operation that' +
        ' is not permitted: Verify token invalid-verify-token is invalid');
    });
  });

  it('amqp: should be able to return error if invalid verification token', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.challenge': '15f7d1a91c1f40f8a748fd134752feb3',
      'hub.verify_token': 'invalid-verify-token',
    };

    return service.amqp
      .publishAndWait('social.instagram.webhook', params)
      .reflect()
      .then((response) => {
        const error = response.error();

        assert.equal(error.message, 'An attempt was made to perform an operation that' +
          ' is not permitted: Verify token invalid-verify-token is invalid');
      });
  });

  it('amqp: should be able to verify subscription', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.challenge': '15f7d1a91c1f40f8a748fd134752feb3',
      'hub.verify_token': 'your-verify-token',
    };

    return service.amqp
      .publishAndWait('social.instagram.webhook', params)
      .reflect()
      .then((response) => {
        const data = response.value();

        assert.equal(data, '15f7d1a91c1f40f8a748fd134752feb3');
      });
  });

  it('http: should be able to verify subscription', () => {
    const params = {
      'hub.mode': 'subscribe',
      'hub.challenge': '15f7d1a91c1f40f8a748fd134752feb3',
      'hub.verify_token': 'your-verify-token',
    };

    return http({ qs: params })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.equal(response.body, '15f7d1a91c1f40f8a748fd134752feb3');
      });
  });

  it('amqp: should be able to return error if receives media from unknown user', () => {
    const userId = Date.now().toString();
    const params = { 0: subcriptionRequest(userId) };

    return service.amqp
      .publishAndWait('social.instagram.webhook', params)
      .reflect()
      .then((response) => {
        const error = response.error();

        assert.equal(error.message, `Not Found: "Feed for user #${userId}"`);
      });
  });

  it('http: should be able to return error if receives media from unknown user', () => {
    const userId = Date.now().toString();
    const params = { 0: subcriptionRequest(userId) };

    return http({
      method: 'post',
      body: params,
    })
    .then((response) => {
      assert.equal(response.statusCode, 404);
      assert.equal(response.body.message, `Not Found: "Feed for user #${userId}"`);
    });
  });

  it('should be able to save media', () => {
    const userId = Date.now().toString();
    const feed = feedFactory(userId);
    const mock = sinon.mock(request);
    const params = { 0: subcriptionRequest(userId) };

    mock
      .expects('get')
      .withArgs({
        url: `https://api.instagram.com/v1/media/1234567890123456789_${userId}?`
          + `access_token=${userId}.1a1a111.111aa111aaaa1111a1a111a1aa1111aa`,
        json: true,
      })
      .returns(Promise.resolve(getMediaResponse(userId)))
      .once();

    return service
      .services.feed
      .registerFeed(feed)
      .then(() => service.amqp.publishAndWait('social.instagram.webhook', params))
      .reflect()
      .then((response) => {
        const data = response.value();

        assert.deepEqual(data, { media: 1 });
        mock.verify();
        mock.restore();
      });
  });
});
