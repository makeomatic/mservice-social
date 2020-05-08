exports.up = async (knex) => {
  return knex.schema.table('statuses', (table) => {
    table.string('account');
    table.index(['id', 'account']);
    table.index(['account', 'id']);
  });
};

exports.down = async (knex) => {
  return knex.schema.table('statuses', (table) => {
    table.dropColumn('account');
    table.dropIndex(['id', 'account']);
    table.dropIndex(['account', 'id']);
  });
};
