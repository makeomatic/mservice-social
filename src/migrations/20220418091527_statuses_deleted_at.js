const kPartialIdIndexName = 'idx_id_partial_deleted_at';
const kPartialAccountIndexName = 'idx_account_partial_deleted_at';
const kTable = 'statuses';

exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.timestamp('deleted_at');
  });

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kPartialIdIndexName} on ${kTable} (id) WHERE deleted_at IS NULL`);

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kPartialAccountIndexName} on ${kTable} (account) WHERE deleted_at IS NULL`);
};

exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropIndex(null, kPartialAccountIndexName);
    table.dropIndex(null, kPartialIdIndexName);
    table.dropColumn('deleted_at');
  });
};
