const kTable = 'statuses';

exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.timestamp('deleted_at');
  });
};

exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropColumn('deleted_at');
  });
};
