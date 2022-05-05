const kTable = 'statuses';
const kColumn = 'text';

exports.up = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.string(kColumn, 1024).alter();
  });
};

exports.down = async () => {
  return knex.schema.alterTable(kTable, (table) => {
    table.string(kColumn, 512).alter();
  });
};
