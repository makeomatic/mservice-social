const { Promise } = require('bluebird');
const prepareSocial = require('../../src');

describe('00.start-stop', function testSuite() {
  let social;

  it('should create social', async () => {
    social = await prepareSocial();
    await social.connect();
  });

  it('wait a bit', async () => {
    await Promise.delay(10000);
  });

  it('should close social', async () => {
    await social.close();
  });
});
