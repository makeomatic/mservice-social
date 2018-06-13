const assert = require('assert');
const Promise = require('bluebird');
const request = require('request-promise');
const sinon = require('sinon');
const Social = require('../../src');

const createFeedFixture = require('../fixtures/instagram/create-feed');
const syncOnReconnectFixture = require('../fixtures/instagram/sync-on-reconnect');
const instagramMediaFactory = require('../fixtures/instagram/instagram-media');

const config = {
  instagram: {
    enabled: true,
    client: {
      id: 'client-id',
      secret: 'client-secret',
    },
    syncOnInterval: false,
    syncInterval: 500,
  },
};

describe('instagram', function testSuite() {
  after('clean instagram_media', () => this.service.knex('instagram_media').delete());
  after('clean feeds', () => this.service.knex('feeds').delete());
  after('shutdown service', () => this.service.close());
  before('launch service', () => {
    this.service = new Social(config);
    return this.service.connect();
  });

  it('should be able to register feed', async () => {
    const params = {
      internal: 'foo@instagram.com',
      network: 'instagram',
      accounts: [{
        id: '555',
        token: '555.1',
        username: 'perchik',
      }],
    };
    const mock = sinon.mock(request);

    mock
      .expects('get')
      .withArgs({
        json: true,
        url: 'https://api.instagram.com/v1/media/1385552885716996590_555/comments?access_token=555.1',
      })
      .returns({
        data: [{
          created_time: '1280780324',
          text: 'Really amazing photo!',
          from: {
            username: 'snoopdogg',
            profile_picture: 'http://images.instagram.com/profiles/profile_16_75sq_1305612434.jpg',
            id: '1574083',
            full_name: 'Snoop Dogg',
          },
          id: '420',
        }],
      })
      .once();

    mock
      .expects('get')
      .withArgs({
        json: true,
        url: 'https://api.instagram.com/v1/media/1385552885716996589_555/comments?access_token=555.1',
      })
      .returns({
        data: [],
      })
      .once();

    mock
      .expects('get')
      .withArgs(createFeedFixture.request.first)
      .returns(createFeedFixture.response.first)
      .once();
    mock
      .expects('get')
      .withArgs(createFeedFixture.request.second)
      .returns(createFeedFixture.response.second)
      .once();

    const response = await this.service.amqp
      .publishAndWait('social.feed.register', params)
      .reflect();

    const { data } = response.value();
    assert.equal(data.length, 1);
    mock.verify();
    mock.restore();
  });

  it('should be able to synchronize media on reconnect', () => {
    const mock = sinon.mock(request);
    mock
      .expects('get')
      .withArgs(syncOnReconnectFixture.request)
      .returns(syncOnReconnectFixture.response)
      .once();

    mock
      .expects('get')
      .withArgs({
        json: true,
        url: 'https://api.instagram.com/v1/media/1385552885716996591_555/comments?access_token=555.1',
      })
      .returns({
        data: [{
          created_time: '1280780324',
          text: 'Really amazing photo!',
          from: {
            username: 'snoopdogg',
            profile_picture: 'http://images.instagram.com/profiles/profile_16_75sq_1305612434.jpg',
            id: '1574083',
            full_name: 'Snoop Dogg',
          },
          id: '420',
        }],
      })
      .once();

    return this.service
      .close()
      .then(() => {
        const service = this.service = new Social(config);

        return service.connect();
      })
      .then(() => {
        mock.verify();
        mock.restore();

        return null;
      });
  });

  it('should be able to synchronize on interval', async () => {
    const stub = sinon.stub(request, 'get');
    const mediaStub = stub
      .withArgs(syncOnReconnectFixture.request);

    const media = Array.from({ length: 3 }, (_, i) => {
      /** start from previously fetched id */
      const id = `138555288571699659${2 + i}`;
      const prev = `138555288571699659${1 + i}`;

      stub
        .withArgs({
          json: true,
          url: `https://api.instagram.com/v1/media/${id}_555/comments?access_token=555.1`,
        })
        .returns({
          data: [],
        });

      const response = {
        pagination: {
          next_url: `https://api.instagram.com/v1/users/555/media/recent?access_token=555.1&count=200&max_id=${prev}_555`,
          next_max_id: prev,
        },
        meta: {
          code: 200,
        },
        data: [instagramMediaFactory(id, '555')],
      };

      mediaStub
        .onCall(i)
        .returns(response);

      return response;
    });

    await this.service.close();

    this.service = new Social({
      ...config,
      instagram: {
        ...config.instagram,
        syncMediaOnStart: false,
        syncOnInterval: true,
      },
    });

    await this.service.connect();

    /** let the service to sync several times */
    await Promise.delay(config.instagram.syncInterval * (media.length + 1));

    media.forEach((it) => {
      assert.ok(mediaStub.returned(it));
    });

    stub.reset();
  });
});
