const nock = require('nock');
const url = require('url');
const debug = require('debug');
const log = debug('twitter:intercept');

function interceptTwitterApi() {
  log('using twitter api interceptor');
  nock.disableNetConnect()
  nock('https://api.twitter.com')
    .persist()
    .get((uri) => {
      log(`getting request for uri=${uri}`);
      return uri.includes('users/lookup');
    })
    .reply(function (uri, requestBody) {
      log('checkin users/lookup');
      const q = url.parse(uri, true);
      log(`Intercepted GET request to: ${uri}`);
      log('Request body: ', requestBody);
      log(`query:${JSON.stringify(q.query)}`);
      return [200, [
        require(`./data/${q.query.screen_name}/user.json`)
      ]];
    });

  nock('https://api.twitter.com')
    .persist()
    .get((uri) => {
      log(`getting request for uri=${uri}`);
      return uri.includes('statuses/user_timeline');
    })
    .reply(function (uri, requestBody) {
      log('checkin statuses/user_timeline');
      const q = url.parse(uri, true);
      log(`Intercepted GET request to: ${uri}`);
      log('Request body: ', requestBody);
      log(`query:${JSON.stringify(q.query)}`);
      const response = [
        require(`./data/${q.query.screen_name}/original.json`),
        require(`./data/${q.query.screen_name}/reply.json`),
        require(`./data/${q.query.screen_name}/retweet.json`),
      ];
      return [200, response];
    });

  nock('https://api.twitter.com')
    .persist()
    .get((uri) => {
      log(1, () => `getting request for uri=${uri}`);
      return uri.includes('statuses/show');
    })
    .reply(function (uri, requestBody) {
      const q = url.parse(uri, true);

      log('checkin statuses/show');
      log(`Intercepted GET request to: ${uri}`);
      log('Request body: ', requestBody);
      log(`query:${JSON.stringify(q.query)}`);

      const filename = q.pathname.split("/").pop()
      const screenName = "v_aminev"
      const tweets = require(`./data/${screenName}/tweets.json`)

      return [200, require(`./data/${screenName}/${tweets[filename]}`)];
    });
}

module.exports = {
  interceptTwitterApi
}
