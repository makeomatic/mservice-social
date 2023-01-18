const kPartialIdIndexName = 'idx_id_partial_deleted_at';
const kPartialAccountIndexName = 'idx_account_partial_deleted_at';
const kTable = 'statuses';
const conditionalExpr = 'deleted_at IS NULL';

exports.up = async (knex) => {
  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kPartialIdIndexName} on ${kTable} (id) WHERE ${conditionalExpr}`);

  await knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS ${kPartialAccountIndexName} on ${kTable} (account) WHERE ${conditionalExpr}`);
};

exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropIndex(null, kPartialAccountIndexName);
    table.dropIndex(null, kPartialIdIndexName);
  });
};
