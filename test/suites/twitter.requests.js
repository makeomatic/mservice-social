const Promise = require('bluebird');
const assert = require('assert');
const { TweetType } = require('../../src/services/twitter/tweet-types');

[ // restrictedTypeNames, allowedTypes
  [['tweet', 'retweet'], [TweetType.REPLY, TweetType.QUOTE]],
  [['reply'], [TweetType.ORIGINAL, TweetType.RETWEET, TweetType.QUOTE]],
  [['retweet', 'reply', 'quote'], [TweetType.ORIGINAL]],
].forEach(([restrictedTypeNames, allowedTypes]) => {
  describe(`tweet requests: ${restrictedTypeNames.join(',')} `, function testSuite() {
    const Social = require('../../src');
    let service;

    before('start service', async () => {
      service = new Social({
        ...global.SERVICES,
        notifier: {
          enabled: false,

        },
        twitter: {
          ...global.SERVICES.twitter,
          requests: {
            restrictedTypes: [...restrictedTypeNames],
          },
        },
      });
      await service.connect();
    });

    after('cleanup feeds', () => service.knex('feeds').delete());

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

    it('wait for stream to startup', () => Promise.delay(5000));

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
