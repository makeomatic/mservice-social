exports.up = function up(knex) {
  return knex.schema.hasTable('statuses').then((exists) => {
    if (!exists) return null;

    return knex.schema.raw('alter table statuses alter column id type varchar using id::varchar;');
  });
};

exports.down = function down() {

};
