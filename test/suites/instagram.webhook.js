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
  instagram: {
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
  },
};
const service = new Social(config);

describe('instagram.webhook', function testSuite() {
  before('start up service', () => service.connect());
  after('cleanup feeds', () => service.knex('feeds').delete());
  after('shutdown service', () => service.close());

  it('should be able to return error if invalid verification token', () => {
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

  it('should be able to verify subscription', () => {
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

  it('should not be able to save media if receives media from unknown user', () => {
    const userId = Date.now().toString();
    const params = [subcriptionRequest(userId)];

    return http({
      method: 'post',
      body: params,
    })
    .then((response) => {
      assert.deepEqual(response.body, { media: 0 });
    });
  });

  it('should be able to save media', () => {
    const userId = Date.now().toString();
    const feed = feedFactory(userId);
    const mock = sinon.mock(request);
    const params = [subcriptionRequest(userId)];

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
      .service('storage')
      .feeds()
      .save(feed)
      .then(() => http({
        method: 'post',
        body: params,
      }))
      .then((response) => {
        assert.deepEqual(response.body, { media: 1 });
        mock.verify();
        mock.restore();
      });
  });
});
