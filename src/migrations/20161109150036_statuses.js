exports.up = function up(knex) {
  return knex.schema.hasTable('statuses').then((exists) => {
    if (exists) return null;

    return knex.schema.createTable('statuses', (table) => {
      table.bigInteger('id').primary();
      table.string('date');
      table.string('text');
      table.jsonb('meta');
    });
  });
};

exports.down = function down() {

};
