const Promise = require('bluebird');
const assert = require('assert');
const wtf = require('wtfnode');
const prepareService = require('../../src');

const filterByType = (tweets, type) => tweets.filter((x) => Number.parseInt(x.attributes.type, 10) === type);

// eslint-disable-next-line func-names
describe('twitter.filter.js', function () {
  const tests = [
    {
      name: 'test-1',
      ignoreFilters: true,
      filters: { filterReplies: true, filterRetweets: true },
      expectedTypes: [0, 1],
      filteredTypes: [],
    },
    {
      name: 'test-2',
      ignoreFilters: false,
      filters: { filterReplies: true, filterRetweets: true },
      expectedTypes: [0],
      filteredTypes: [],
    },
  ];

  tests.forEach(({
    name, ignoreFilters, filters, expectedTypes, filteredTypes,
  }) => {
    // eslint-disable-next-line func-names
    describe(`${name}`, function testSuite() {
      let service;

      before('start service', async () => {
        const { filterReplies, filterRetweets } = filters;

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
        await service.knex('feeds').delete();
      });

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

      after('shutdown service', async () => service.close());
    });
  });

  after('after all', async () => {
    await Promise.delay(1000);
    wtf.dump();
    process.exit(0);
  });
});
