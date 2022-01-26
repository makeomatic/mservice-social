const kTable = 'statuses';

exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.boolean('is_deleted').notNullable().defaultTo(false);
  });

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS idx_tweet_deleted_asc on ${kTable} using BTREE (id ASC, account, is_deleted)`);

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS idx_tweet_deleted_desc on ${kTable} using BTREE (id DESC, account, is_deleted)`);
};

exports.down = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.dropColumn('is_deleted');
    table.dropIndex(null, 'idx_tweet_deleted_asc');
    table.dropIndex(null, 'idx_tweet_deleted_desc');
  });
};
