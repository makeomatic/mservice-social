const Promise = require('bluebird');
const assert = require('assert');

const filterByType = (tweets, type) => tweets.filter((x) => Number.parseInt(x.attributes.type, 10) === type);

[
  [true, [true, true], [0, 1], []],
  [false, [true, true], [0], []], // check filteredTypes more correctly with own later
].forEach(([ignoreFilters, filters, expectedTypes, filteredTypes]) => {
  describe('twitter filter statuses', function testSuite() {
    const prepareService = require('../../src');
    let service;

    before('start service', async () => {
      const [filterReplies, filterRetweets] = filters;

      service = await prepareService({
        notifier: {
          enabled: false,
        },
        twitter: {
          stream_filters: {
            replies: filterReplies,
            retweets: filterRetweets,
            quotes: true,
            userMentions: true,
            hashTags: true,
            skipValidAccounts: ignoreFilters,
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
          { username: 'v_aminev' },
        ],
      };

      await service.amqp
        .publishAndWait('social.feed.register', payload, { timeout: 15000 });
    });

    it('wait for stream to startup', () => Promise.delay(10000));

    it(`tweet filtering [skip_valid_acc=${ignoreFilters}]`, async () => {
      const response = await service.amqp
        .publishAndWait('social.feed.read', { filter: { account: 'v_aminev' } });

      assert(response.data.length);

      expectedTypes.forEach((type) => {
        const tweets = filterByType(response.data, type);
        assert(tweets.length, `no tweets of ${type} type`);
      });

      filteredTypes.forEach((type) => {
        const tweets = filterByType(response.data, type);
        assert.strictEqual(tweets.length, 0, `unsupported tweet type ${type} received`);
      });
    });

    after('shutdown service', () => service.close());
  });
});
