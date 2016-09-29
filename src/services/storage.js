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
    const page = data.filter.page;
    const pageSize = data.filter.pageSize;
    const cursor = data.filter.cursor;
    const offset = page * pageSize;
    const order = data.filter.order;

    const query = this.client('statuses')
      .select(this.client.raw('meta->>\'account\' as account, *'))
      .whereRaw('meta->>\'account\' = ?', [data.filter.account])
      .orderBy('id', order)
      .limit(pageSize)
      .offset(offset);

    if (cursor) {
      return order === 'desc'
        ? query.where('id', '<', cursor)
        : query.where('id', '>', cursor);
    }

    return query;
  }
}

module.exports = Storage;
