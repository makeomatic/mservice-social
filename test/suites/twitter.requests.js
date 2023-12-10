const Promise = require('bluebird');
const assert = require('assert');
const { TweetType } = require('../../src/services/twitter/tweet-types');
const prepareSocial = require('../../src');

// eslint-disable-next-line func-names
describe('tweeter.requests.js', function () {
  const tests = [
    {
      name: 'test-1, restricted to tweet and retweet with types: reply, quote',
      restrictedTypeNames: ['tweet', 'retweet'],
      allowedTypes: [TweetType.REPLY, TweetType.QUOTE],
    },
    {
      name: 'test-2, restricted to replies with types: original, retweet, quote',
      restrictedTypeNames: ['reply'],
      allowedTypes: [TweetType.ORIGINAL, TweetType.RETWEET, TweetType.QUOTE],
    },
    {
      name: 'test-3, restricted to retweet, reply, quote with types: original only',
      restrictedTypeNames: ['retweet', 'reply', 'quote'],
      allowedTypes: [TweetType.ORIGINAL],
    },
  ];

  tests.forEach(({ name, restrictedTypeNames, allowedTypes }) => {
    // eslint-disable-next-line func-names
    describe(`${name}`, function () {
      let service;

      before(async () => {
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
        await service.knex('feeds').delete();
      });

      after(async () => {
        await service.close();
      });

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
    });
  });
});
