const assert = require('assert');
const Chance = require('chance');
const noop = require('lodash/noop');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
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
          })
        )
        .then(() => social.close());
    });
    after('clean up feeds', () => {
      const social = new Social();

      return social
        .connect()
        .then(() => social.knex('feeds').delete())
        .then(() => social.close());
    });

    it('should be able to synchronize media on start up', () => {
      const mock = sinon.mock(request);
      const social = new Social({
        facebook: {
          enabled: true,
          syncMediaOnStart: true,
          subscribeOnStart: false,
        },
      });

      mock
        .expects('get')
        .withArgs({
          url: `https://graph.facebook.com/v2.8/1/feed?access_token=token1&`
            + 'fields=attachments,message,story,picture,link&limit=100',
          json: true,
        })
        .returns({
          data: [{
            id: '1_1',
            message: 'Foo',
          }],
        })
        .once();

      return social
        .connect()
        .then(() => {
          mock.verify();
        })
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
          url: 'https://graph.facebook.com/2/subscriptions?access_token=2|secret1',
          formData: {
            object: 'page',
            fields: 'feed',
            verify_token: 'my-verify-token',
            callback_url: 'https://my-call.back',
          },
        })
        .returns(Promise.resolve({ success: true }));

      return social
        .connect()
        .then(() => {
          mock.verify();
        })
        .finally(() => social.close());
    });
  });
});
