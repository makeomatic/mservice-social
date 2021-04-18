exports.up = async (knex) => {
  return knex.schema.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tweets_id_account on statuses using BTREE (id DESC, account);
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tweets_account_id on statuses using BTREE (account, id DESC);
    DROP INDEX IF EXISTS idx_tweets_ids_lower_account;
    DROP INDEX IF EXISTS idx_tweets_lower_account;
    DROP INDEX IF EXISTS idx_tweets_lower_account_ids;
    DROP INDEX IF EXISTS idx_tweets_account;
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tweets_account on statuses using BTREE (account);
  `);
};

exports.down = async () => {

};
