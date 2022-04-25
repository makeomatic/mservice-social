const kIndexName = 'idx_tweets_account_deleted_at';
const kPartialIndexName = 'idx_id_partial_deleted_at';
const kTable = 'statuses';

exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.timestamp('deleted_at');
  });

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kIndexName} on ${kTable} using BTREE (account, deleted_at)`);

  await knex.schema
  .raw(`CREATE INDEX IF NOT EXISTS ${kIndexName} on ${kTable} (id) WHERE deleted_at IS NULL`);

};

exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropIndex(null, kPartialIndexName);
    table.dropIndex(null, kIndexName);
    table.dropColumn('deleted_at');
  });
};
