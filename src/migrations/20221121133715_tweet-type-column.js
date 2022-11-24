const kTable = 'statuses';

exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.bigInteger('type');
  });

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS idx_tweets_id_asc_account_type on ${kTable} using BTREE (id, account, type)`);
  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS idx_tweets_id_desc_account_type on ${kTable} using BTREE (id DESC, account, type)`);
};

exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropIndex(null, 'idx_tweets_id_desc_account_type');
    table.dropIndex(null, 'idx_tweets_id_asc_account_type');
    table.dropColumn('type');
  });
};
