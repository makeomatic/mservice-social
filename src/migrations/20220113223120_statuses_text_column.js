exports.up = async (knex) => {
  return knex.schema.alterTable('statuses', (table) => {
    table.string('text', 512).alter();
  });
};

exports.down = async () => {

};
