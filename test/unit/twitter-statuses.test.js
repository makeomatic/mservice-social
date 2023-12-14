/* eslint-disable no-console */

const TwitterStatusesTest = require('../../src/services/storage/twitter-statuses');

describe('TwitterStatuses', function Nitter() {
  let twitterStatuses;
  let knex;
  before(async () => {
    // eslint-disable-next-line import/no-unresolved
    knex = require('knex')({
      client: 'pg',
      debug: false,
      connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: '',
      },
      pool: {
        min: 0,
        max: 10,
        acquireTimeoutMillis: 30000,
      },
      searchPath: ['public', 'social'],
    });
    twitterStatuses = new TwitterStatusesTest(knex, 'statuses');
  });

  it('should load last known tweet', async () => {
    const account = 'v_aminev';
    const result = await twitterStatuses.last({ account });

    console.log(result);
  });

  after(async () => {
    await knex.destroy();
  });
});
