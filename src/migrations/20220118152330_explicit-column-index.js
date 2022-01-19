exports.up = function up(knex) {
  return knex.schema.alterTable('statuses', (table) => {
    table.boolean('explicit').notNullable().defaultTo(false);
    table.index(['account', 'explicit']);
  });
};

exports.down = function up(knex) {
  return knex.schema.alterTable('statuses', (table) => {
    table.dropColumn('explicit');
    table.dropIndex(['account', 'explicit']);
  });
};
