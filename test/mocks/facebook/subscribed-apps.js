const proofGenerator = require('../../../src/services/facebook/proof-generator');

function subscribedApps(mock, pageId, accessToken) {
  return mock
    .expects('post')
    .withArgs({
      json: true,
      qs: {
        appsecret_proof: proofGenerator('appSecret1', accessToken),
        access_token: accessToken,
      },
      url: `https://graph.facebook.com/v2.8/${pageId}/subscribed_apps`,
    })
    .returns({ success: true })
    .once();
}

module.exports = subscribedApps;
