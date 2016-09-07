const knex = require('knex');

class Storage {
  constructor(config) {
    this.client = knex({
      client: 'pg',
      connection: config.connection,
      searchPath: 'public,social',
    });
  }

  fetchFeeds(where) {
    return this.client.select().from('feeds').where(where);
  }

  insert(data) {
    return this.client('statuses').insert(data);
  }
}

module.exports = Storage;
