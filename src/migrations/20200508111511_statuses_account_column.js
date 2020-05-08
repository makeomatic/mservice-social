exports.up = async (knex) => {
  return knex.schema.table('statuses', (table) => {
    table.string('account');
  });
};

exports.down = async (knex) => {
  return knex.schema.table('statuses', (table) => {
    table.dropColumn('account');
  });
};
