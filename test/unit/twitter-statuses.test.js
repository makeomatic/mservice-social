/* eslint-disable no-console */

const TwitterStatusesTest = require('../../src/services/storage/twitter-statuses');

describe('TwitterStatuses', function Nitter() {
  let twitterStatuses;

  // eslint-disable-next-line import/no-unresolved
  const knex = require('knex')({
    client: 'pg',
    debug: false,
    connection: {
      host: '127.0.0.1',
      user: 'postgres',
      password: '',
    },
    pool: {
      min: 1,
      max: 10,
      acquireTimeoutMillis: 30000,
    },
    searchPath: ['public', 'social'],
  });

  before(async () => {
    twitterStatuses = new TwitterStatusesTest(knex, 'statuses');
  });

  after(async () => {
    await knex.destroy();
  });

  it('should load last known tweet', async () => {
    const account = 'v_aminev';
    const result = await twitterStatuses.last({ account });

    console.log(result);
  });
});
