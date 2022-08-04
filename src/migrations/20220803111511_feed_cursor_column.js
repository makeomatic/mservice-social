exports.up = async (knex) => {
  return knex.schema.table('feeds', (table) => {
    table.bigInteger('cursor');
  });
};

exports.down = async (knex) => {
  return knex.schema.table('feeds', (table) => {
    table.dropColumn('cursor');
  });
};
