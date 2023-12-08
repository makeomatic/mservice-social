const Promise = require('bluebird');
const assert = require('assert');
const { TweetType } = require('../../src/services/twitter/tweet-types');
const prepareSocial = require('../../src');

[ // restrictedTypeNames, allowedTypes
  [['tweet', 'retweet'], [TweetType.REPLY, TweetType.QUOTE]],
  [['reply'], [TweetType.ORIGINAL, TweetType.RETWEET, TweetType.QUOTE]],
  [['retweet', 'reply', 'quote'], [TweetType.ORIGINAL]],
].forEach(([restrictedTypeNames, allowedTypes]) => {
  describe(`tweeter.requests.js: restricted types->${restrictedTypeNames.join(',')} `, function() {
    let service;
    before('start service', async () => {
      service = await prepareSocial({
        notifier: {
          enabled: false,
        },
        twitter: {
          requests: {
            restrictedTypes: [...restrictedTypeNames],
          },
        },
      });
      await service.connect();
    });

    after('clean up feeds', () => service.knex('feeds').delete());

    it('should register feed', async () => {
      const payload = {
        internal: 'test@test.ru',
        network: 'twitter',
        accounts: [
          { username: 'evgenypoyarkov' },
          { id: '2533316504', username: 'v_aminev' },
        ],
      };

      await service.amqp
        .publishAndWait('social.feed.register', payload, { timeout: 15000 });
    });

    it('wait for stream to startup', () => Promise.delay(30000));

    it('should have collected some tweets', async () => {
      const response = await service.amqp
        .publishAndWait('social.feed.read', { filter: { account: 'v_aminev' } });

      assert.notEqual(response.data.length, 0);

      response.data.forEach((tweet) => {
        assert(allowedTypes.includes(+tweet.attributes.type));
      });
    });

    after('shutdown service', () => service.close());
  });
});
