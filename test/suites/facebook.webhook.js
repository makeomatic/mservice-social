const assert = require('assert');
const Chance = require('chance');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
const prepareSocial = require('../../src');

const chance = new Chance();
const http = request.defaults({
  uri: 'http://localhost:3000/api/social/facebook/webhook',
  simple: false,
  resolveWithFullResponse: true,
  json: true,
});
const config = {
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
};

describe('facebook.webhook', function testSuite() {
  let social;

  before('start up service', async () => {
    social = await prepareSocial(config);
    await social.connect();
  });

  before('create feed', () => {
    const pageId = Date.now().toString();
    const params = {
      internal: chance.email(),
      network: 'facebook',
      network_id: pageId,
      meta: JSON.stringify({
        id: pageId,
        name: 'City',
        tasks: [],
        token: 'token1',
        category: 'News',
      }),
    };

    return social
      .service('storage')
      .feeds()
      .save(params)
      .then((feed) => {
        this.feed = feed;
        return feed;
      });
  });
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
      assert.equal(response.body.message, 'An attempt was made to perform an operation that'
        + ' is not permitted: Verify token invalid-verify-token is invalid');
      return null;
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
        return null;
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
        assert.deepEqual(response.body, { add: 0, remove: 0, edited: 0 });
        return null;
      });
  });

  it('should be able to save media', () => {
    const mock = sinon.mock(request);
    const params = {
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            post_id: `${this.feed.meta.id}_1`,
            sender_name: 'Oblakotilo',
            sender_id: this.feed.meta.id,
            item: 'status',
            verb: 'add',
            published: 1,
            created_time: 1480020997,
            message: 'test',
          },
        }],
        id: this.feed.meta.id,
        time: 1480020998,
      }],
      object: 'page',
    };

    mock
      .expects('get')
      .withArgs({
        url: `https://graph.facebook.com/v2.8/${this.feed.meta.id}_1`,
        json: true,
        qs: {
          access_token: 'token1',
          fields: 'attachments,message,story,picture,link,created_time,likes.summary(true),'
            + 'shares,comments.summary(true),permalink_url',
          appsecret_proof: 'b222753b515c4c7865d64fa88b8aa676b66cef581344cb3dffb47e5c46163c98',
        },
      })
      .onCall(0)
      .rejects({
        error: {
          error: {
            code: 32,
          },
        },
      })
      .onCall(1)
      .resolves({
        created_time: '2016-11-24T20:56:37+0000',
        message: 'test',
        id: `${this.feed.meta.id}_1`,
      })
      .twice();

    return http({
      method: 'post',
      body: params,
    })
      .then((response) => {
        assert.deepEqual(response.body, { add: 1, remove: 0, edited: 0 });
        mock.verify();
        return null;
      });
  });

  it('should be able to edit media', () => {
    const mock = sinon.mock(request);
    const params = {
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            post_id: `${this.feed.meta.id}_1`,
            sender_name: 'Oblakotilo',
            sender_id: this.feed.meta.id,
            item: 'status',
            verb: 'edited',
            published: 1,
            created_time: 1480020997,
            message: 'test 2',
          },
        }],
        id: this.feed.meta.id,
        time: 1480020998,
      }],
      object: 'page',
    };

    mock
      .expects('get')
      .withArgs({
        url: `https://graph.facebook.com/v2.8/${this.feed.meta.id}_1`,
        json: true,
        qs: {
          access_token: 'token1',
          fields: 'attachments,message,story,picture,link,created_time,likes.summary(true),'
            + 'shares,comments.summary(true),permalink_url',
          appsecret_proof: 'b222753b515c4c7865d64fa88b8aa676b66cef581344cb3dffb47e5c46163c98',
        },
      })
      .returns(Promise.resolve({
        created_time: '2016-11-24T20:56:37+0000',
        message: 'test 2',
        id: `${this.feed.meta.id}_1`,
      }))
      .once();

    return http({
      method: 'post',
      body: params,
    })
      .then((response) => {
        assert.deepEqual(response.body, { add: 0, remove: 0, edited: 1 });
        mock.verify();
        return null;
      });
  });

  it('should be able to delete media', () => {
    const params = {
      entry: [{
        changes: [{
          field: 'feed',
          value: {
            post_id: `${this.feed.meta.id}_1`,
            sender_name: 'Oblakotilo',
            sender_id: this.feed.meta.id,
            item: 'status',
            verb: 'remove',
            created_time: 1480020997,
          },
        }],
        id: this.feed.meta.id,
        time: 1480020998,
      }],
      object: 'page',
    };

    return http({
      method: 'post',
      body: params,
    })
      .then((response) => {
        assert.deepEqual(response.body, { add: 0, remove: 1, edited: 0 });
        return null;
      });
  });
});
