const assert = require('assert');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');

const social = new Social({
  facebook: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
    app: {
      id: 'appId1',
      secret: 'appSecret1',
    },
  },
  twitter: {
    enabled: true,
  },
});

describe('feed.register', function feedRegisterSuite() {
  before('start up service', () => social.connect());
  after('clean up feeds', () => social.knex('feeds').delete());
  after('stop service', () => social.close());

  describe('facebook', function facebookSuite() {
    before('create feed', () => social
      .service('storage')
      .feeds()
      .save({
        internal: 'foo@facebook.com',
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
    );

    it('should be able to unsubscribe app', () => {
      const mock = sinon.mock(request);
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
      };

      mock
        .expects('delete')
        .withArgs({
          json: true,
          qs: {
            appsecret_proof: 'fc33475ced8abe62f65ef09843c6cb2767e562eb424fa859c3ec47fc1d6e9cd7',
            access_token: 'token1',
          },
          url: 'https://graph.facebook.com/v2.8/1/subscribed_apps',
        })
        .returns({ success: true })
        .once();

      return social.amqp
        .publishAndWait('social.feed.remove', params)
        .reflect()
        .then((response) => {
          assert(response.isFulfilled());
          mock.verify();
        });
    });
  });
});
