const assert = require('assert');
const Promise = require('bluebird');
const request = require('request-promise');
const Social = require('../../src');

const pageId = Date.now().toString();
const config = {
  facebook: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
  },
};
const http = request.defaults({
  uri: 'http://localhost:3000/api/social/facebook/media/list',
  simple: false,
  resolveWithFullResponse: true,
  json: true,
  method: 'post',
});
const service = new Social(config);

function istagramMediaFactory(postId, id) {
  return {
    message: 'Foo',
    id: `${id}_${postId}`,
  };
}

describe('facebook.media.list', function testSuite() {
  before('start up service', () => service.connect());

  before('create facebook media', () => {
    const facebook = service.service('facebook');
    const ids = ['1111111111111111111', '1111111111111111112', '1111111111111111113'];

    return Promise.map(ids, id => facebook.media.save(istagramMediaFactory(id, pageId)));
  });

  after('shutdown service', () => service.close());

  describe('amqp', () => {
    it('should be able to a list of media ordered by desc', () => {
      const params = { filter: { pageId } };

      return service.amqp
        .publishAndWait('social.facebook.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '1111111111111111111');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111113');
          assert.equal(second.id, '1111111111111111112');
          assert.equal(third.id, '1111111111111111111');
        });
    });

    it('should be able to a list of media ordered by asc', () => {
      const params = {
        filter: { pageId },
        sort: 'id',
      };

      return service.amqp
        .publishAndWait('social.facebook.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '1111111111111111113');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111111');
          assert.equal(second.id, '1111111111111111112');
          assert.equal(third.id, '1111111111111111113');
        });
    });

    it('should be able to a list of media with size and cursor', () => {
      const params = {
        filter: { pageId },
        page: {
          size: 1,
          cursor: '1111111111111111113',
        },
      };

      return service.amqp
        .publishAndWait('social.facebook.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor, before } = meta;
          const [first] = data;

          assert.equal(count, 1);
          assert.equal(cursor, '1111111111111111112');
          assert.equal(before, '1111111111111111113');
          assert.equal(data.length, 1);
          assert.equal(first.id, '1111111111111111112');
        });
    });
  });

  describe('http', () => {
    it('should be able to a list of media ordered by desc', () => {
      const params = { filter: { pageId } };

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
        });
    });

    it('should be able to a list of media ordered by asc', () => {
      const params = {
        filter: { pageId },
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
        });
    });

    it('should be able to a list of media with size and cursor', () => {
      const params = {
        filter: { pageId },
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
        });
    });
  });
});
