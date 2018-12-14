exports.up = function(knex) {
  return knex.schema.raw('create index idx_tweets_account on statuses using BTREE ((meta->>\'account\'))');
};

exports.down = function(knex) {
  return knex.schema.raw('drop index idx_tweets_account');
};
