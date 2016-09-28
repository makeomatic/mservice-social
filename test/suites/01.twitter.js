const Promise = require('bluebird');
const { expect } = require('chai');
const merge = require('lodash/merge');

describe('twitter', function testSuite() {
  const Social = require('../../src');
  const request = require('../helpers/request');

  const uri = {
    register: 'social.feed.register',
    list: 'social.feed.list',
    readAMQP: 'social.feed.read',
    read: 'http://0.0.0.0:3000/api/social/feed/read',
  };

  const payload = {
    register: {
      internal: 'test@test.ru',
      network: 'twitter',
      filter: {
        accounts: [
          { username: 'sotona' },
          { username: 'pixiv' },
        ],
      },
    },
    list: {
      filter: {
        internal: 'test@test.ru',
      },
    },
    read: {
      filter: {
        account: 'sotona',
      },
    },

    registerFail: {},
  };

  let tweetId;

  before('start service', () => {
    const service = this.service = new Social(global.SERVICES);
    return service.connect();
  });

  it('should return error if request to register is not valid', () => {
    return this.service.amqp.publishAndWait(uri.register, payload.registerFail)
      .reflect()
      .then((response) => {
        expect(response.isRejected()).to.be.equals(true);
      });
  });

  it('should register feed', () => {
    return this.service.amqp.publishAndWait(uri.register, payload.register)
      .reflect()
      .then((response) => {
        expect(response.isFulfilled()).to.be.equal(true);
      });
  });

  it('should return newly registered feed', () => {
    return this.service.amqp.publishAndWait(uri.list, payload.list)
      .reflect()
      .then((response) => {
        expect(response.isFulfilled()).to.be.equal(true);
        const body = response.value();
        expect(body.length).not.to.be.equal(0);
        expect(body[0].id).to.be.equal(1);
      });
  });

  // that long?
  it('wait for stream to startup', () => Promise.delay(9000));

  it('post tweet and wait for it to arrive', (done) => {
    this.service.services.twitter.client.post(
      'statuses/update',
      { status: 'Test status' },
      (error, tweet) => {
        tweetId = tweet.id_str;
        // why so long?
        setTimeout(done, 9000);
      });
  });

  it('should have collected some tweets', () => {
    return request(uri.read, merge(payload.read, { token: this.adminToken }))
      .then((response) => {
        const { body, statusCode } = response;
        expect(statusCode).to.be.equal(200);
        expect(body.length).to.be.not.equal(0);
      });
  });

  it('confirm amqp request to read works', () => {
    return this.service.amqp.publishAndWait(uri.readAMQP, payload.read)
      .reflect()
      .then((response) => {
        expect(response.isFulfilled()).to.be.equal(true);
        const body = response.value();
        expect(body.length).to.be.not.equal(0);
      });
  });

  after('delete tweet', (done) => {
    this
      .service
      .services
      .twitter
      .client
      .post(`statuses/destroy/${tweetId}`, () => done());
  });

  after('shutdown service', () => this.service.close());
});
