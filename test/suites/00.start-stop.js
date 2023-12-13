const { Promise } = require('bluebird');
const whyRunning = require('why-is-node-running');
const prepareSocial = require('../../src');

describe('00.start-stop', function testSuite() {
  let social;

  it('should create social', async () => {
    social = await prepareSocial();
    await social.connect();
  });

  it('should register feed', async () => {
    await social.amqp
      .publishAndWait('social.feed.register', {
        internal: 'test@test.ru',
        network: 'twitter',
        accounts: [
          { username: 'evgenypoyarkov' },
          { id: '2533316504', username: 'v_aminev' },
        ],
      }, { timeout: 15000 });
  });

  it('wait a bit', async () => {
    await Promise.delay(50000);
  });

  it('should close social', async () => {
    await social.close();
  });

  after(() => {
    whyRunning();
  });
});
