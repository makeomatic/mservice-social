const assert = require('assert');
const istagramMediaFactory = require('../fixtures/instagram/instagram-media');
const Promise = require('bluebird');
const request = require('request-promise');
const Social = require('../../src');

const accountId = Date.now().toString();
const config = {
  instagram: {
    enabled: true,
    syncMediaOnStart: false,
    subscribeOnStart: false,
  },
};
const http = request.defaults({
  uri: 'http://localhost:3000/api/social/instagram/media/list',
  simple: false,
  resolveWithFullResponse: true,
  json: true,
  method: 'post',
});
const service = new Social(config);

describe('instagram.media.list', function testSuite() {
  before('start up service', () => service.connect());

  before('create instagram media', () => {
    const instagram = service.getService(Social.SERVICE_INSTAGRAM);
    const ids = ['1111111111111111111', '1111111111111111112', '1111111111111111113'];

    return Promise.map(ids, id => instagram.saveMedia(istagramMediaFactory(id, accountId)));
  });

  after('shutdown service', () => service.close());

  describe('amqp', () => {
    it('should be able to a list of media ordered by desc', () => {
      const params = { filter: { accountId } };

      return service.amqp
        .publishAndWait('social.instagram.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, `1111111111111111111_${accountId}`);
          assert.equal(data.length, 3);
          assert.equal(first.id, `1111111111111111113_${accountId}`);
          assert.equal(second.id, `1111111111111111112_${accountId}`);
          assert.equal(third.id, `1111111111111111111_${accountId}`);
        });
    });

    it('should be able to a list of media ordered by asc', () => {
      const params = {
        filter: { accountId },
        sort: 'id',
      };

      return service.amqp
        .publishAndWait('social.instagram.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor } = meta;
          const [first, second, third] = data;

          assert.equal(count, 3);
          assert.equal(cursor, `1111111111111111113_${accountId}`);
          assert.equal(data.length, 3);
          assert.equal(first.id, `1111111111111111111_${accountId}`);
          assert.equal(second.id, `1111111111111111112_${accountId}`);
          assert.equal(third.id, `1111111111111111113_${accountId}`);
        });
    });

    it('should be able to a list of media with size and cursor', () => {
      const params = {
        filter: { accountId },
        page: {
          size: 1,
          cursor: `1111111111111111113_${accountId}`,
        },
      };

      return service.amqp
        .publishAndWait('social.instagram.media.list', params)
        .reflect()
        .then((response) => {
          const { meta, data } = response.value();
          const { count, cursor, before } = meta;
          const [first] = data;

          assert.equal(count, 1);
          assert.equal(cursor, `1111111111111111112_${accountId}`);
          assert.equal(before, `1111111111111111113_${accountId}`);
          assert.equal(data.length, 1);
          assert.equal(first.id, `1111111111111111112_${accountId}`);
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
          assert.equal(cursor, `1111111111111111111_${accountId}`);
          assert.equal(data.length, 3);
          assert.equal(first.id, `1111111111111111113_${accountId}`);
          assert.equal(second.id, `1111111111111111112_${accountId}`);
          assert.equal(third.id, `1111111111111111111_${accountId}`);
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
          assert.equal(cursor, `1111111111111111113_${accountId}`);
          assert.equal(data.length, 3);
          assert.equal(first.id, `1111111111111111111_${accountId}`);
          assert.equal(second.id, `1111111111111111112_${accountId}`);
          assert.equal(third.id, `1111111111111111113_${accountId}`);
        });
    });

    it('should be able to a list of media with size and cursor', () => {
      const params = {
        filter: { accountId },
        page: {
          size: 1,
          cursor: `1111111111111111113_${accountId}`,
        },
      };

      return http({ body: params })
        .then((response) => {
          assert.equal(response.statusCode, 200);

          const { meta, data } = response.body;
          const { count, cursor, before } = meta;
          const [first] = data;

          assert.equal(count, 1);
          assert.equal(cursor, `1111111111111111112_${accountId}`);
          assert.equal(before, `1111111111111111113_${accountId}`);
          assert.equal(data.length, 1);
          assert.equal(first.id, `1111111111111111112_${accountId}`);
        });
    });
  });
});
