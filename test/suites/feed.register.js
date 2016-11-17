const assert = require('assert');
const Social = require('../../src');

const config = {
  instagram: {
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
      filter: {},
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
    it('should be able to return error if empty filter', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        filter: {},
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.filter should have'
            + ' required property \'accounts\', data.filter should match some schema in anyOf');
        });
    });

    it('should be able to return error if invalid filter', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        filter: {
          foo: ['bar'],
        },
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.filter should NOT have'
            + ' additional properties, data.filter should have required property \'accounts\','
            + ' data.filter should match some schema in anyOf');
        });
    });

    it('should be able to return error if invalid filter accounts', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'instagram',
        filter: {
          accounts: [{
            id: 'foo@bar.com',
            username: 'foo',
          }],
        },
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.filter.accounts[0]'
            + ' should have required property \'token\'');
        });
    });
  });

  describe('twitter', function instagramSuite() {
    it('should be able to return error if empty filter', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        filter: {},
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.filter should have'
            + ' required property \'accounts\', data.filter should match some schema in anyOf');
        });
    });

    it('should be able to return error if invalid filter', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        filter: {
          foo: ['bar'],
        },
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.filter should NOT have'
            + ' additional properties, data.filter should have required property \'accounts\','
            + ' data.filter should match some schema in anyOf');
        });
    });

    it('should be able to return error if invalid filter accounts', () => {
      const params = {
        internal: 'foo@instagram.com',
        network: 'twitter',
        filter: {
          accounts: [{
            id: 'foo@bar.com',
          }],
        },
      };

      return service.amqp
        .publishAndWait('social.feed.register', params)
        .reflect()
        .then((response) => {
          const { message } = response.error();

          assert.equal(message, 'feed.register validation failed: data.filter.accounts[0]'
            + ' should have required property \'username\'');
        });
    });
  });
});
