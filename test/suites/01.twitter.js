const Social = require('../../src');

const { expect } = require('chai');
const request = require('./../helpers/request');

describe('twitter', function testSuite() {
  const uri = {
    register: 'http://0.0.0.0:3000/api/social/feed/register',
  };

  const payload = {
    register: {},
    registerFail: {},
  };

  before('start service', () => {
    const chat = this.chat = new Social(global.SERVICES);
    return chat.connect();
  });

  it('should return error if request to register is not valid', done => {
    request(uri.register, payload.registerFail)
      .then(response => {
        expect(response.statusCode).to.be.equals(400);
        expect(response.body.name).to.be.equals('ValidationError');
        done();
      });
  });

  after('shutdown service', () => this.chat.close());
});
