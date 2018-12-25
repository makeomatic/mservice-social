exports.up = function up(knex) {
  return knex.schema.table('feeds', (table) => {
    table.boolean('invalid').notNullable().defaultTo(false);
    table.index(['network', 'invalid']);
  });
};

exports.down = function up(knex) {
  return knex.schema.table('feeds', (table) => {
    table.dropColumn('invalid');
    table.dropIndex(['network', 'invalid']);
  });
};
