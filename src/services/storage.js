const knex = require('knex');
const Promise = require('bluebird');

class Storage {
  constructor(config) {
    this.client = knex({
      client: 'pg',
      connection: config.connection,
      searchPath: 'public,social',
    });
  }

  init() {
    const feeds = this.client.schema
      .createTableIfNotExists('feeds', function createFeedsTable(table) {
        table.increments();
        table.string('internal');
        table.string('network');
        table.jsonb('filter');
      });

    const statuses = this.client.schema
      .createTableIfNotExists('statuses', function createStatusesTable(table) {
        table.bigIncrements();
        table.biginteger('feed_id');
        table.string('date');
        table.string('text');
        table.jsonb('meta');
      });

    return Promise.all([feeds, statuses]);
  }

  fetchFeeds(where) {
    return this.client.select().from('feeds').where(where);
  }

  registerFeed(data) {
    return this.client('feeds').insert(data);
  }

  listFeeds(data) {
    let query = this.client('feeds');
    if (data.filter.id) {
      query = query.where({ internal: data.filter.internal });
    }
    return query;
  }

  insertStatus(data) {
    return this.client('statuses').insert(data);
  }

  readStatuses(data) {
    return this.client('statuses')
      .leftJoin('feeds', 'feeds.id', 'statuses.feed_id')
      .where({ internal: data.filter.internal });
  }
}

module.exports = Storage;
