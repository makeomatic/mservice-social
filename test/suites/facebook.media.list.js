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

function istagramMediaFactory(params) {
  return {
    message: 'Foo',
    id: `${params.pageId}_${params.postId}`,
    created_time: params.createdTime,
    picture: 'https://external.xx.fbcdn.net/safe_image.php?d=AQDDucmRBtRHqIzg&w=130&h=130&url'
      + '=http%3A%2F%2Fi0.wp.com%2Fpeopledotcom.files.wordpress.com%2F2016%2F11%2Fcarrie-fish'
      + 'er-2.jpg%3Fcrop%3D111px%252C0px%252C1777px%252C1333px%26resize%3D660%252C495%26ssl%3'
      + 'D1&cfs=1&sx=0&sy=0&sw=495&sh=495&_nc_hash=AQAbqRhsnlL1g6Ps',
  };
}

describe('facebook.media.list', function testSuite() {
  before('start up service', () => service.connect());

  before('create facebook media', () => {
    const facebook = service.service('facebook');
    const posts = [
      { pageId, postId: '1111111111111111111', createdTime: '2016-11-01T20:00:00+0000' },
      { pageId, postId: '1111111111111111112', createdTime: '2016-10-01T20:00:00+0000' },
      { pageId, postId: '1111111111111111113', createdTime: '2016-10-15T20:00:00+0000' },
    ];

    return Promise.map(posts, params => facebook.media.save(istagramMediaFactory(params)));
  });

  after('shutdown service', () => service.close());

  describe('amqp', () => {
    it('should be able to get a list of media ordered by desc', () => {
      const params = { filter: { pageId } };

      return service.amqp
        .publishAndWait('social.facebook.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '2016-10-01T20:00:00.000Z');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111111');
          assert.equal(first.type, 'facebookMedia');
          assert.equal(first.attributes.meta.picture, 'http://i0.wp.com/peopledotcom.files.'
            + 'wordpress.com/2016/11/carrie-fisher-2.jpg?crop=111px%2C0px%2C1777px%2C1333px'
            + '&resize=660%2C495&ssl=1');
          assert.equal(second.id, '1111111111111111113');
          assert.equal(third.id, '1111111111111111112');

          return null;
        });
    });

    it('should be able to get a list of media ordered by asc', () => {
      const params = {
        filter: { pageId },
        sort: 'created_time',
      };

      return service.amqp
        .publishAndWait('social.facebook.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '2016-11-01T20:00:00.000Z');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111112');
          assert.equal(second.id, '1111111111111111113');
          assert.equal(third.id, '1111111111111111111');

          return null;
        });
    });

    it('should be able to get a list of media with size and cursor', () => {
      const params = {
        filter: { pageId },
        page: {
          size: 1,
          cursor: '2016-11-01T20:00:00.000Z',
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
          assert.equal(cursor, '2016-10-15T20:00:00.000Z');
          assert.equal(before, '2016-11-01T20:00:00.000Z');
          assert.equal(data.length, 1);
          assert.equal(first.id, '1111111111111111113');

          return null;
        });
    });
  });

  describe('http', () => {
    it('should be able to get a list of media ordered by desc', () => {
      const params = { filter: { pageId } };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '2016-10-01T20:00:00.000Z');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111111');
          assert.equal(first.type, 'facebookMedia');
          assert.equal(second.id, '1111111111111111113');
          assert.equal(third.id, '1111111111111111112');

          return null;
        });
    });

    it('should be able to get a list of media ordered by asc', () => {
      const params = {
        filter: { pageId },
        sort: 'created_time',
      };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, '2016-11-01T20:00:00.000Z');
          assert.equal(data.length, 3);
          assert.equal(first.id, '1111111111111111112');
          assert.equal(second.id, '1111111111111111113');
          assert.equal(third.id, '1111111111111111111');

          return null;
        });
    });

    it('should be able to get a list of media with size and cursor', () => {
      const params = {
        filter: { pageId },
        page: {
          size: 1,
          cursor: '2016-11-01T20:00:00.000Z',
        },
      };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor, before } = meta;
          const [first] = data;

          assert.equal(count, 1);
          assert.equal(cursor, '2016-10-15T20:00:00.000Z');
          assert.equal(before, '2016-11-01T20:00:00.000Z');
          assert.equal(data.length, 1);
          assert.equal(first.id, '1111111111111111113');

          return null;
        });
    });
  });
});
