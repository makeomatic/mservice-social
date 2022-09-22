const kIndexName = 'idx_tweets_account_explicit';

exports.up = (knex) => {
  return knex.schema
    .raw(`create index if not exists ${kIndexName} on statuses using BTREE (account, explicit)`);
};

exports.down = (knex) => {
  return knex.schema.raw(`drop index if exists ${kIndexName}`);
};
