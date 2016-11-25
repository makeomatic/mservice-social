exports.up = function up(knex) {
  return knex.schema.createTable('facebook_media', (table) => {
    table.bigInteger('id').notNullable();
    table.string('page_id').notNullable();
    table.timestamp('created_time').notNullable();
    table.jsonb('meta').notNullable();

    table.primary(['page_id', 'id']);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('facebook_media');
};
