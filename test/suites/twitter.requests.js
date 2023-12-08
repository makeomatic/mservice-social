const Promise = require('bluebird');
const assert = require('assert');
const wtf = require('wtfnode');
const { TweetType } = require('../../src/services/twitter/tweet-types');
const prepareSocial = require('../../src');

// eslint-disable-next-line func-names
describe('tweeter.requests.js', function () {
  const tests = [
    {
      name: 'test-1',
      restrictedTypeNames: ['tweet', 'retweet'],
      allowedTypes: [TweetType.REPLY, TweetType.QUOTE],
    },
    {
      name: 'test-2',
      restrictedTypeNames: ['reply'],
      allowedTypes: [TweetType.ORIGINAL, TweetType.RETWEET, TweetType.QUOTE],
    },
    {
      name: 'test-3',
      restrictedTypeNames: ['retweet', 'reply', 'quote'],
      allowedTypes: [TweetType.ORIGINAL],
    },
  ];

  tests.forEach(({ name, restrictedTypeNames, allowedTypes }) => {
    // eslint-disable-next-line func-names
    describe(`${name}`, function () {
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
        await service.knex('feeds').delete();
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

      it('wait for stream to startup', () => Promise.delay(5000));

      it('should have collected some tweets', async () => {
        const response = await service.amqp
          .publishAndWait('social.feed.read', { filter: { account: 'v_aminev' } });

        assert.notEqual(response.data.length, 0);

        response.data.forEach((tweet) => {
          assert(allowedTypes.includes(+tweet.attributes.type));
        });
      });

      after('shutdown service', async () => service.close());
    });
  });

  after('after all', async () => {
    await Promise.delay(1000);
    wtf.dump();
    process.exit(0);
  });
});
