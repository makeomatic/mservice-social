const kIndexName = 'idx_tweets_account_deleted_at';
const kTable = 'statuses';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.timestamp('deleted_at');
  });

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kIndexName} on ${kTable} using BTREE (account, deleted_at)`);

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropColumn('deleted_at');
    table.dropIndex(null, kIndexName);
  });
};
