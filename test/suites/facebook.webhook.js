const assert = require('assert');
const Chance = require('chance');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');

const chance = new Chance();
const http = request.defaults({
  uri: 'http://localhost:3000/api/social/facebook/webhook',
  simple: false,
  resolveWithFullResponse: true,
  json: true,
});
const social = new Social({
  facebook: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
    app: {
      id: '2',
      secret: 'secret1',
    },
    subscriptions: [
      {
        object: 'page',
        fields: 'feed',
        verifyToken: 'my-verify-token',
        callbackUrl: 'https://my-call.back',
      },
    ],
  },
});

describe('instagram.webhook', function testSuite() {
  before('start up service', () => social.connect());
  after('cleanup feeds', () => social.knex('feeds').delete());
  after('shutdown service', () => social.close());

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
      'hub.verify_token': 'my-verify-token',
    };

    return http({ qs: params })
      .then((response) => {
        assert.equal(response.statusCode, 200);
        assert.equal(response.body, '15f7d1a91c1f40f8a748fd134752feb3');
      });
  });

  it('should not be able to save media if receives media from unknown user', () => {
    const params = {
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            post_id: '1_1',
            sender_name: 'Foo',
            sender_id: 1,
            item: 'status',
            verb: 'add',
            published: 1,
            created_time: 1480020997,
            message: 'test',
          },
        }],
        id: '1',
        time: 1480020998,
      }],
      object: 'page',
    };

    return http({
      method: 'post',
      body: params,
    })
    .then((response) => {
      assert.deepEqual(response.body, { media: 0 });
    });
  });

  it('should be able to save media', () => {
    const pageId = Date.now().toString();
    const feed = {
      internal: chance.email(),
      network: 'facebook',
      network_id: pageId,
      meta: JSON.stringify({
        id: pageId,
        name: 'City',
        perms: [],
        token: 'token1',
        category: 'News',
      }),
    };
    const mock = sinon.mock(request);
    const params = {
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            post_id: `${pageId}_1`,
            sender_name: 'Oblakotilo',
            sender_id: pageId,
            item: 'status',
            verb: 'add',
            published: 1,
            created_time: 1480020997,
            message: 'test',
          },
        }],
        id: pageId,
        time: 1480020998,
      }],
      object: 'page',
    };

    mock
      .expects('get')
      .withArgs({
        url: `https://graph.facebook.com/v2.8/${pageId}_1?access_token=token1&fields=`
          + 'attachments,message,story,picture,link',
        json: true,
      })
      .returns(Promise.resolve({
        created_time: '2016-11-24T20:56:37+0000',
        message: 'test',
        id: `${pageId}_1`,
      }))
      .once();

    return social
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
      });
  });
});
