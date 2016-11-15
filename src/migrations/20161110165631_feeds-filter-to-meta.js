exports.up = function up(knex) {
  return knex.schema.table('feeds', (table) => {
    table.renameColumn('filter', 'meta');
  });
};

exports.down = function down() {

};
