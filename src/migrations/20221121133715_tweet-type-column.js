const kTable = 'statuses';

exports.up = async (knex) => {
  await knex.schema.alterTable(kTable, (table) => {
    table.bigInteger('type');
  });
};

exports.down = async (knex) => {
  return knex.schema.alterTable(kTable, (table) => {
    table.dropColumn('type');
  });
};
