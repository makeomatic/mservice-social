const kIndexName = 'idx_tweets_ids_lower_account';
const kTable = 'statuses';

exports.up = async (knex) => {
  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kIndexName} on ${kTable} using BTREE (id DESC, (lower(meta->>'account')))`);
};

exports.down = async (knex) => {
  return knex.schema.raw(`drop index ${kIndexName}`);
};
