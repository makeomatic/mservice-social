exports.up = function up(knex) {
  return knex.schema.hasTable('feeds').then((exists) => {
    if (exists) return null;

    return knex.schema.createTable('feeds', (table) => {
      table.increments();
      table.string('internal');
      table.string('network');
      table.string('network_id');

      // contains filter settings
      table.jsonb('filter');

      // make sure that each account can only have a unique internal + network + id component
      table.unique(['internal', 'network', 'network_id']);
    });
  });
};

exports.down = function down() {

};
