exports.up = function up(knex) {
  return knex.schema.createTable('instagram_media', (table) => {
    table.bigInteger('id').notNullable();
    table.string('user_id').notNullable();
    table.string('username').notNullable();
    table.timestamp('created_time').notNullable();
    table.jsonb('media').notNullable();
    table.jsonb('comments').notNullable();

    table.primary(['user_id', 'id']);
  });
};

exports.down = function down() {

};
