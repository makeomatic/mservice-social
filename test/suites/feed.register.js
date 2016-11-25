const assert = require('assert');
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
  },
};
const service = new Social(config);

describe('feed.register', function feedRegisterSuite() {
  before('start up service', () => service.connect());
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
        });
    });

    it('should be able to register new feed', () => {
      const mock = sinon.mock(request);
      const firstAccountId = this.firstAccountId = `1${Date.now()}`;
      const secondAccountId = this.secondAccountId = `2${Date.now()}`;
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'Website',
          id: firstAccountId,
          name: 'Music',
          perms: [],
          token: 'token1',
        }, {
          category: 'News',
          id: secondAccountId,
          name: 'City',
          perms: [],
          token: 'token2',
        }],
      };
      const firstResponse1 = {
        data: [{
          id: `${firstAccountId}_100`,
        }, {
          message: 'Super post',
          id: `${firstAccountId}_10`,
        }],
        paging: {
          next: `https://graph.facebook.com/v2.8/${firstAccountId}/feed?access_token=token1&`
            + 'fields=attachments,message,story,picture,link&limit=100&__paging_token=pageToken1',
        },
      };
      const firstResponse2 = {
        data: [{
          id: `${firstAccountId}_2`,
        }, {
          message: 'Super post',
          id: `${firstAccountId}_1`,
        }],
        paging: {
          next: `https://graph.facebook.com/v2.8/${firstAccountId}/feed?access_token=token1&`
            + 'fields=attachments,message,story,picture,link&limit=100&__paging_token=pageToken2',
        },
      };
      const firstResponse3 = { data: [] };
      const secondResponse1 = {
        data: [{
          id: `${secondAccountId}_99`,
        }, {
          message: 'Super post',
          id: `${secondAccountId}_9`,
        }],
        paging: {
          next: `https://graph.facebook.com/v2.8/${secondAccountId}/feed?access_token=token2&`
            + 'fields=attachments,message,story,picture,link&limit=100&__paging_token=pageToken3',
        },
      };
      const secondResponse2 = {
        data: [{
          id: `${secondAccountId}_2`,
        }, {
          message: 'Super post',
          id: `${secondAccountId}_1`,
        }],
        paging: {
          next: `https://graph.facebook.com/v2.8/${secondAccountId}/feed?access_token=token2&`
            + 'fields=attachments,message,story,picture,link&limit=100&__paging_token=pageToken4',
        },
      };
      const secondResponse3 = { data: [] };
      const firstRequest1 = {
        url: `https://graph.facebook.com/v2.8/${firstAccountId}/feed?access_token=token1&`
          + 'fields=attachments,message,story,picture,link&limit=100',
        json: true,
      };
      const firstRequest2 = { url: firstResponse1.paging.next, json: true };
      const firstRequest3 = { url: firstResponse2.paging.next, json: true };
      const secondRequest1 = {
        url: `https://graph.facebook.com/v2.8/${secondAccountId}/feed?access_token=token2&`
          + 'fields=attachments,message,story,picture,link&limit=100',
        json: true,
      };
      const secondRequest2 = { url: secondResponse1.paging.next, json: true };
      const secondRequest3 = { url: secondResponse2.paging.next, json: true };

      mock.expects('get').withArgs(firstRequest1).returns(firstResponse1).once();
      mock.expects('get').withArgs(firstRequest2).returns(firstResponse2).once();
      mock.expects('get').withArgs(firstRequest3).returns(firstResponse3).once();
      mock.expects('get').withArgs(secondRequest1).returns(secondResponse1).once();
      mock.expects('get').withArgs(secondRequest2).returns(secondResponse2).once();
      mock.expects('get').withArgs(secondRequest3).returns(secondResponse3).once();
      // subscribe app
      mock
        .expects('post')
        .withArgs({
          url: `https://graph.facebook.com/${firstAccountId}/subscribed_apps?access_token=token1`,
        })
        .returns({ success: true })
        .once();
      mock
        .expects('post')
        .withArgs({
          url: `https://graph.facebook.com/${secondAccountId}/subscribed_apps?access_token=token2`,
        })
        .returns({ success: true })
        .once();

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { data } = response.value();

          assert.equal(data.length, 2);

          mock.verify();
          mock.restore();
        });
    });

    // depend on previous test
    it('should be able to update feed', () => {
      const mock = sinon.mock(request);
      const params = {
        internal: 'foo@facebook.com',
        network: 'facebook',
        accounts: [{
          category: 'Website',
          id: this.firstAccountId,
          name: 'Music',
          perms: [],
          token: 'token3',
        }, {
          category: 'News',
          id: this.secondAccountId,
          name: 'City',
          perms: [],
          token: 'token4',
        }],
      };
      const firstResponse1 = {
        data: [{
          id: `${this.firstAccountId}_101`,
        }, {
          message: 'Super post',
          id: `${this.firstAccountId}_100`,
        }],
        paging: {
          next: `https://graph.facebook.com/v2.8/${this.firstAccountId}/feed?access_token=token3&`
            + 'fields=attachments,message,story,picture,link&limit=100&__paging_token=pageToken1',
        },
      };
      const secondResponse1 = {
        data: [{
          id: `${this.secondAccountId}_100`,
        }, {
          message: 'Super post',
          id: `${this.secondAccountId}_99`,
        }],
        paging: {
          next: `https://graph.facebook.com/v2.8/${this.secondAccountId}/feed?access_token=token4&`
            + 'fields=attachments,message,story,picture,link&limit=100&__paging_token=pageToken2',
        },
      };
      const firstRequest1 = {
        url: `https://graph.facebook.com/v2.8/${this.firstAccountId}/feed?access_token=token3&`
          + 'fields=attachments,message,story,picture,link&limit=100',
        json: true,
      };
      const secondRequest1 = {
        url: `https://graph.facebook.com/v2.8/${this.secondAccountId}/feed?access_token=token4&`
          + 'fields=attachments,message,story,picture,link&limit=100',
        json: true,
      };

      mock.expects('get').withArgs(firstRequest1).returns(firstResponse1).once();
      mock.expects('get').withArgs(secondRequest1).returns(secondResponse1).once();
      // subscribe app
      mock
        .expects('post')
        .withArgs({
          url: `https://graph.facebook.com/${this.firstAccountId}/subscribed_apps?access_token=token3`,
        })
        .returns({ success: true })
        .once();
      mock
        .expects('post')
        .withArgs({
          url: `https://graph.facebook.com/${this.secondAccountId}/subscribed_apps?access_token=token4`,
        })
        .returns({ success: true })
        .once();

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { data } = response.value();

          assert.equal(data.length, 2);

          mock.verify();
          mock.restore();
        });
    });
  });
});
