const assert = require('assert');
const request = require('request-promise');
const sinon = require('sinon');
const { mockPageFeeds } = require('../mocks/facebook/page-feeds');
const mockSubscribedApps = require('../mocks/facebook/subscribed-apps');
const prepareSocial = require('../../src');

const config = {
  instagram: {
    enabled: true,
    syncMediaOnStart: false,
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

describe('feed.register', function feedRegisterSuite() {
  let service;

  before('start up service', async () => {
    service = await prepareSocial(config);
    await service.connect();
  });

  after('cleanup feeds', () => service.knex('feeds').delete());
  after('shutdown service', () => service.close());

  it('must be able to return error if invalid network', async () => {
    const params = {
      internal: 'foo@instagram.com',
      network: 'odnokassniki',
      accounts: [],
    };

    await assert.rejects(
      service.amqp.publishAndWait('social.feed.register', params),
      'feed.register validation failed: data.network'
      + ' should be equal to one of the allowed values'
    );
  });

  describe('instagram', function instagramSuite() {
    it('should be able to return error if no accounts', async () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed:'
        + ' data should have required property \'accounts\''
      );
    });

    it('should be able to return error if invalid accounts', async () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        accounts: {},
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed:'
            + ' data.accounts should be array, data.accounts should be array'
      );
    });

    it('should be able to return error if invalid account', async () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        accounts: [{
          id: 'foo@bar.com',
          username: 'foo',
        }],
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed: data.accounts[0]'
            + ' should have required property \'token\''
      );
    });
  });

  describe('twitter', function instagramSuite() {
    it('should be able to return error if no accounts', async () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed:'
            + ' data should have required property \'accounts\''
      );
    });

    it('should be able to return error if invalid accounts', async () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        accounts: {},
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed:'
            + ' data.accounts should be array, data.accounts should be array'
      );
    });

    it('should be able to return error if invalid account', async () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        accounts: [{
          id: 'foo@bar.com',
        }],
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed: data.accounts[0]'
            + ' should have required property \'username\''
      );
    });
  });

  describe('facebook', function facebookSuite() {
    it('should be able to return error if no accounts', async () => {
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed:'
            + ' data should have required property \'accounts\''
      );
    });

    it('should be able to return error if invalid accounts', async () => {
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: {},
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed:'
            + ' data.accounts should be array, data.accounts should be array'
      );
    });

    it('should be able to return error if invalid account', async () => {
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'music',
          id: '111111111111111',
          name: 'Music',
          tasks: [],
        }],
      };

      await assert.rejects(
        service.amqp.publishAndWait('social.feed.register', params),
        'feed.register validation failed: data.accounts[0]'
            + ' should have required property \'token\''
      );
    });

    it('must be able to register new feed', () => {
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
          tasks: [],
          token: 'token1',
        }, {
          category: 'News',
          id: secondPageId,
          name: 'City',
          tasks: [],
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
        .then(({ data }) => {
          assert.equal(data.length, 2);

          mock.verify();
          mock.restore();

          return null;
        });
    });

    // depend on previous test
    it('must be able to update feed', () => {
      const mock = sinon.mock(request);
      const { firstPageId, secondPageId } = this;
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'Website',
          id: firstPageId,
          name: 'Music',
          tasks: [],
          token: 'token3',
        }, {
          category: 'News',
          id: secondPageId,
          name: 'City',
          tasks: [],
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
        .then(({ data }) => {
          assert.equal(data.length, 2);

          mock.verify();
          mock.restore();

          return null;
        });
    });
  });
});
