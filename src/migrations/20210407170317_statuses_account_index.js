const kIndexAscName = 'idx_tweets_id_asc_account';
const kIndexDescName = 'idx_tweets_id_desc_account';
const kTable = 'statuses';

exports.up = async (knex) => {
  return knex.raw(
    `CREATE INDEX EXISTS ${kIndexAscName} on ${kTable} using BTREE (id ASC, account);` +
    `CREATE INDEX EXISTS ${kIndexDescName} on ${kTable} using BTREE (id DESC, account)`
  );
};

exports.down = async (knex) => {
  return knex.schema.table(kTable, (table) => {
    table.dropIndex(null, kIndexDescName)
    table.dropIndex(null, kIndexAscName)
  });
};
