const Chance = require('chance');
const Promise = require('bluebird');
const request = require('request-promise');
const { StatusCodeError } = require('request-promise/errors');
const assert = require('assert');
const sinon = require('sinon');
const { mockPageFeeds, makeRequest } = require('../mocks/facebook/page-feeds');
const Social = require('../../src');

const chance = new Chance();

describe('service', function suite() {
  describe('facebook', function facebookSuite() {
    before('create feed', () => {
      const social = new Social();

      return social
        .connect()
        .then(() => social
          .service('storage')
          .feeds()
          .save({
            internal: chance.email(),
            network: 'facebook',
            network_id: '1',
            meta: JSON.stringify({
              id: '1',
              name: 'City',
              perms: [],
              token: 'token1',
              category: 'News',
            }),
          }))
        .then(() => social
          .service('storage')
          .facebookMedia()
          .save({
            id: '2',
            page_id: '1',
            created_time: '2016-11-02T20:56:37+0000',
            meta: JSON.stringify({
              id: '1_2',
              message: 'Post #1',
              created_time: '2016-11-02T20:56:37+0000',
            }),
          }))
        .then(() => social.close());
    });
    after('clean up feeds', () => {
      const social = new Social();

      return social
        .connect()
        .then(() => social.knex('feeds').delete())
        .then(() => social.knex('facebook_media').delete())
        .then(() => social.close());
    });

    it('should be able to synchronize media on start up', () => {
      const mock = sinon.mock(request);
      const social = new Social({
        facebook: {
          enabled: true,
          syncMediaOnStart: true,
          subscribeOnStart: false,
          app: {
            id: 'appId1',
            secret: 'appSecret1',
          },
        },
      });

      mockPageFeeds(
        mock,
        { pageId: '1', accessToken: 'token1' },
        {
          ids: [
            { id: 2, createdTime: '2016-11-02T20:56:37+0000' },
            { id: 1, createdTime: '2016-11-01T20:56:37+0000' },
          ],
          pageToken: '42',
        }
      );

      return social
        .connect()
        .then(() => mock.verify())
        .finally(() => social.close());
    });

    it('should be able to create subscriptions on start up', () => {
      const mock = sinon.mock(request);
      const social = new Social({
        facebook: {
          enabled: true,
          syncMediaOnStart: false,
          subscribeOnStart: true,
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
      mock
        .expects('post')
        .once()
        .withArgs({
          formData: {
            object: 'page',
            fields: 'feed',
            verify_token: 'my-verify-token',
            callback_url: 'https://my-call.back',
          },
          json: false,
          qs: { access_token: '2|secret1' },
          url: 'https://graph.facebook.com/v2.8/2/subscriptions',
        })
        .returns(Promise.resolve({ success: true }));

      return social
        .connect()
        .then(() => mock.verify())
        .finally(() => social.close());
    });

    it('should invalidate feed on `invalid token` response', async () => {
      const stub = sinon.stub(request, 'get');
      stub
        .withArgs(makeRequest({ pageId: '1', accessToken: 'token1' }))
        .rejects(new StatusCodeError(400, { error: { code: 190 } }))
        .usingPromise(Promise);

      const social = new Social({
        facebook: {
          enabled: true,
          syncMediaOnStart: true,
          subscribeOnStart: false,
          app: {
            id: 'appId1',
            secret: 'appSecret1',
          },
        },
      });

      await social.connect();

      const { invalid } = await social
        .service(Social.SERVICE_STORAGE)
        .feeds()
        .getByNetworkId('facebook', '1');

      assert.equal(invalid, true);

      await social.close();

      stub.reset();
      stub.restore();
    });

    it('should not sync `invalid` feeds', async () => {
      const stub = sinon.stub(request, 'get');
      const social = new Social({
        facebook: {
          enabled: true,
          syncMediaOnStart: true,
          subscribeOnStart: false,
          app: {
            id: 'appId1',
            secret: 'appSecret1',
          },
        },
      });

      await social.connect();

      assert(stub.notCalled);

      await social.close();

      stub.reset();
      stub.restore();
    });
  });
});
