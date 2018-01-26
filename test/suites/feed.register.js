const assert = require('assert');
const mockPageFeeds = require('../mocks/facebook/page-feeds');
const mockSubscribedApps = require('../mocks/facebook/subscribed-apps');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');

const config = {
  instagram: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
  },
  facebook: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
    app: {
      id: 'appId1',
      secret: 'appSecret1',
    },
  },
};
const service = new Social(config);

describe('feed.register', function feedRegisterSuite() {
  before('start up service', () => service.connect());
  after('cleanup feeds', () => service.knex('feeds').delete());
  after('shutdown service', () => service.close());

  it('should be able to return error if invalid network', () => {
    const params = {
      internal: 'foo@instagram.com',
      network: 'odnokassniki',
      accounts: [],
    };

    return service.amqp
      .publishAndWait('social.feed.register', params)
      .reflect()
      .then((response) => {
        const { message } = response.error();

        assert.equal(message, 'feed.register validation failed: data.network'
          + ' should be equal to one of the allowed values');
        return null;
      });
  });

  describe('instagram', function instagramSuite() {
    it('should be able to return error if no accounts', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed:'
            + ' data should have required property \'accounts\'');
          return null;
        });
    });

    it('should be able to return error if invalid accounts', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        accounts: {},
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed:'
            + ' data.accounts should be array, data.accounts should be array');
          return null;
        });
    });

    it('should be able to return error if invalid account', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        accounts: [{
          id: 'foo@bar.com',
          username: 'foo',
        }],
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.accounts[0]'
            + ' should have required property \'token\'');
          return null;
        });
    });
  });

  describe('twitter', function instagramSuite() {
    it('should be able to return error if no accounts', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed:'
            + ' data should have required property \'accounts\'');
          return null;
        });
    });

    it('should be able to return error if invalid accounts', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        accounts: {},
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed:'
            + ' data.accounts should be array, data.accounts should be array');
          return null;
        });
    });

    it('should be able to return error if invalid account', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        accounts: [{
          id: 'foo@bar.com',
        }],
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.accounts[0]'
            + ' should have required property \'username\'');
          return null;
        });
    });
  });

  describe('facebook', function facebookSuite() {
    it('should be able to return error if no accounts', () => {
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed:'
            + ' data should have required property \'accounts\'');
          return null;
        });
    });

    it('should be able to return error if invalid accounts', () => {
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: {},
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed:'
            + ' data.accounts should be array, data.accounts should be array');
          return null;
        });
    });

    it('should be able to return error if invalid account', () => {
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'music',
          id: '111111111111111',
          name: 'Music',
          perms: [],
        }],
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.accounts[0]'
            + ' should have required property \'token\'');

          return null;
        });
    });

    it('should be able to register new feed', () => {
      const mock = sinon.mock(request);
      const firstPageId = this.firstPageId = `1${Date.now()}`;
      const secondPageId = this.secondPageId = `2${Date.now()}`;
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'Website',
          id: firstPageId,
          name: 'Music',
          perms: [],
          token: 'token1',
        }, {
          category: 'News',
          id: secondPageId,
          name: 'City',
          perms: [],
          token: 'token2',
        }],
      };

      /* first facebook page */
      // subscribe app
      mockSubscribedApps(mock, firstPageId, 'token1');
      // fetch history
      mockPageFeeds(
        mock,
        { pageId: firstPageId, accessToken: 'token1' },
        { ids: [100, 10], pageToken: 'pageToken1' }
      );
      mockPageFeeds(
        mock,
        { pageId: firstPageId, accessToken: 'token1', pageToken: 'pageToken1' },
        { ids: [2, 1], pageToken: 'pageToken2' }
      );
      mockPageFeeds(
        mock,
        { pageId: firstPageId, accessToken: 'token1', pageToken: 'pageToken2' },
        { ids: [] }
      );

      /* second facebook page */
      // subscribe app
      mockSubscribedApps(mock, secondPageId, 'token2');
      // fetch history
      mockPageFeeds(
        mock,
        { pageId: secondPageId, accessToken: 'token2' },
        { ids: [99, 9], pageToken: 'pageToken3' }
      );
      mockPageFeeds(
        mock,
        { pageId: secondPageId, accessToken: 'token2', pageToken: 'pageToken3' },
        { ids: [2, 1], pageToken: 'pageToken4' }
      );
      mockPageFeeds(
        mock,
        { pageId: secondPageId, accessToken: 'token2', pageToken: 'pageToken4' },
        { ids: [] }
      );

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { data } = response.value();

          assert.equal(data.length, 2);

          mock.verify();
          mock.restore();

          return null;
        });
    });

    // depend on previous test
    it('should be able to update feed', () => {
      const mock = sinon.mock(request);
      const { firstPageId, secondPageId } = this;
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'Website',
          id: firstPageId,
          name: 'Music',
          perms: [],
          token: 'token3',
        }, {
          category: 'News',
          id: secondPageId,
          name: 'City',
          perms: [],
          token: 'token4',
        }],
      };

      /* first facebook page */
      // subscribe app
      mockSubscribedApps(mock, firstPageId, 'token3');
      // fetch history
      mockPageFeeds(
        mock,
        { pageId: firstPageId, accessToken: 'token3' },
        { ids: [101, 100], pageToken: 'pageToken1' }
      );

      /* second facebook page */
      // subscribe app
      mockSubscribedApps(mock, secondPageId, 'token4');
      // fetch history
      mockPageFeeds(
        mock,
        { pageId: secondPageId, accessToken: 'token4' },
        { ids: [100, 99], pageToken: 'pageToken2' }
      );

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { data } = response.value();

          assert.equal(data.length, 2);

          mock.verify();
          mock.restore();

          return null;
        });
    });
  });
});
