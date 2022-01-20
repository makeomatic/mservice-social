const kTable = 'statuses';

exports.up = function up(knex) {
  knex.schema.alterTable('statuses', (table) => {
    table.boolean('explicit').notNullable().defaultTo(false);
  });

  knex.schema
  .raw(`CREATE INDEX IF NOT EXISTS idx_tweets_id_asc_account on ${kTable} using BTREE (id, 'account')`);

  knex.schema
  .raw(`CREATE INDEX IF NOT EXISTS idx_tweets_id_desc_account on ${kTable} using BTREE (id DESC, 'account')`);

  knex.schema
  .raw(`CREATE INDEX IF NOT EXISTS idx_account_explicit on ${kTable} using BTREE ('account', 'expilicit' )`);
};

exports.down = function up(knex) {
  return knex.schema.alterTable('statuses', (table) => {
    table.dropColumn('explicit');
    table.dropIndex(null, 'idx_account_explicit');
    table.dropIndex(null, 'idx_tweets_id_desc_account');
    table.dropIndex(null, 'idx_tweets_id_asc_account');
  });
};
