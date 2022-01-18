exports.up = function up(knex) {
  return knex.schema.alterTable('statuses', (table) => {
    table.boolean('explicit').notNullable().defaultTo(false);
    table.index(['explicit']);
  });
};

exports.down = function up(knex) {
  return knex.schema.alterTable('statuses', (table) => {
    table.dropColumn('explicit');
    table.dropIndex(['explicit']);
  });
};
