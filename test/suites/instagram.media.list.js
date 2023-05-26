const assert = require('assert');
const Promise = require('bluebird');
const request = require('request-promise');
const istagramMediaFactory = require('../fixtures/instagram/instagram-media');
const prepareSocial = require('../../src');

const accountId = Date.now().toString();
const config = {
  instagram: {
    enabled: true,
    syncMediaOnStart: false,
  },
};
const http = request.defaults({
  uri: 'http://localhost:3000/api/social/instagram/media/list',
  simple: false,
  resolveWithFullResponse: true,
  json: true,
  method: 'post',
});

describe('instagram.media.list', function testSuite() {
  let service;

  before('start up service', async () => {
    service = await prepareSocial(config);
    await service.connect();
  });

  before('create instagram media', () => {
    const instagram = service.service('instagram');
    const ids = ['1111111111111111111', '1111111111111111112', '1111111111111111113'];

    return Promise
      .map(ids, (id) => instagram
        .media()
        .save({
          media: istagramMediaFactory(id, accountId),
          comments: [],
        }));
  });

  after('shutdown service', () => service.close());

  describe('amqp', () => {
    it('should be able to a list of media ordered by desc', () => {
      const params = { filter: { accountId } };

      return service.amqp
        .publishAndWait('social.instagram.media.list', params)
        .then(({ meta, data }) => {
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '1111111111111111111');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111113');
          assert.equal(second.id, '1111111111111111112');
          assert.equal(third.id, '1111111111111111111');

          return null;
        });
    });

    it('should be able to a list of media ordered by asc', () => {
      const params = {
        filter: { accountId },
        sort: 'id',
      };

      return service.amqp
        .publishAndWait('social.instagram.media.list', params)
        .then(({ meta, data }) => {
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '1111111111111111113');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111111');
          assert.equal(second.id, '1111111111111111112');
          assert.equal(third.id, '1111111111111111113');

          return null;
        });
    });

    it('should be able to a list of media with size and cursor', () => {
      const params = {
        filter: { accountId },
        page: {
          size: 1,
          cursor: '1111111111111111113',
        },
      };

      return service.amqp
        .publishAndWait('social.instagram.media.list', params)
        .then(({ meta, data }) => {
          const { count, cursor, before } = meta;
          const [first] = data;

          assert.equal(count, 1);
          assert.equal(cursor, '1111111111111111112');
          assert.equal(before, '1111111111111111113');
          assert.equal(data.length, 1);
          assert.equal(first.id, '1111111111111111112');

          return null;
        });
    });
  });

  describe('http', () => {
    it('should be able to a list of media ordered by desc', () => {
      const params = { filter: { accountId } };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '1111111111111111111');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111113');
          assert.equal(second.id, '1111111111111111112');
          assert.equal(third.id, '1111111111111111111');

          return null;
        });
    });

    it('should be able to a list of media ordered by asc', () => {
      const params = {
        filter: { accountId },
        sort: 'id',
      };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '1111111111111111113');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111111');
          assert.equal(second.id, '1111111111111111112');
          assert.equal(third.id, '1111111111111111113');

          return null;
        });
    });

    it('should be able to a list of media with size and cursor', () => {
      const params = {
        filter: { accountId },
        page: {
          size: 1,
          cursor: '1111111111111111113',
        },
      };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor, before } = meta;
          const [first] = data;

          assert.equal(count, 1);
          assert.equal(cursor, '1111111111111111112');
          assert.equal(before, '1111111111111111113');
          assert.equal(data.length, 1);
          assert.equal(first.id, '1111111111111111112');

          return null;
        });
    });
  });
});
