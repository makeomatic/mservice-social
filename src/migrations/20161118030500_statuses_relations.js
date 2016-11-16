exports.up = function up(knex) {
  return knex.schema.hasTable('statuses').then((exists) => {
    if (!exists) return null;

    return knex.schema.table('statuses', (table) => {
      table.string('network');
    });
  });
};

exports.down = function down() {

};
