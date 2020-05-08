exports.up = async (knex) => {
  return knex.schema.raw("UPDATE statuses SET account = lower(meta->>'account') WHERE account is NULL");
};

exports.down = async () => {

};
