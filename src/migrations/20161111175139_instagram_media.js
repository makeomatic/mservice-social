
exports.up = function up(knex) {
  return knex.schema.createTable('instagram_media', (table) => {
    table.string('id').primary();
    table.string('user_id');
    table.string('username');
    table.timestamp('created_time');
    table.jsonb('meta');
  });
};

exports.down = function down() {

};
