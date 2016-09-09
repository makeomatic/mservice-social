const Social = require('../../src');

const { expect } = require('chai');
const request = require('./../helpers/request');

const merge = require('lodash/merge');

describe('twitter', function testSuite() {
  const uri = {
    register: 'http://0.0.0.0:3000/api/social/feed/register',
    list: 'http://0.0.0.0:3000/api/social/feed/list',
  };

  const payload = {
    register: {
      internal: 'test@test.ru',
      network: 'twitter',
      filter: {
        account: 'pixiv',
      },
    },
    registerFail: {},
    list: {
      filter: {
        internal: 'test@test.ru',
      },
    },
  };

  before('start service', () => {
    const service = this.service = new Social(global.SERVICES);
    return service.connect();
  });

  before('login admin', () => this.service.amqp
    .publishAndWait('users.login', {
      username: 'test@test.ru',
      password: 'megalongsuperpasswordfortest',
      audience: '*.localhost',
    }).tap(reply => {
      this.adminToken = reply.jwt;
    })
  );

  it('should return error if request to register is not valid', done => {
    request(uri.register, merge(payload.registerFail, { token: this.adminToken }))
      .then(response => {
        expect(response.statusCode).to.be.equals(400);
        expect(response.body.name).to.be.equals('ValidationError');
        done();
      });
  });

  it('should register feed', done => {
    request(uri.register, merge(payload.register, { token: this.adminToken }))
      .then(response => {
        const { body, statusCode } = response;
        expect(statusCode).to.be.equal(200);
        expect(body.rowCount).to.be.equal(1);
        done();
      });
  });

  it('should return newly registered feed', done => {
    request(uri.list, merge(payload.list, { token: this.adminToken }))
      .then(response => {
        const { body, statusCode } = response;
        expect(statusCode).to.be.equal(200);
        expect(body.length).to.be.equal(1);
        expect(body[0].id).to.be.equal(1);
        done();
      });
  });

  after('shutdown service', () => this.service.close());
});
