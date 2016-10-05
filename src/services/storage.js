const knex = require('knex');
const Promise = require('bluebird');

class Storage {
  constructor(config) {
    const client = this.client = knex({
      client: 'pg',
      debug: config.debug,
      connection: config.connection,
      searchPath: 'public,social',
    });

    /**
     * Perform an "Upsert" using the "INSERT ... ON CONFLICT ... " syntax in PostgreSQL 9.5
     * @link http://www.postgresql.org/docs/9.5/static/sql-insert.html
     * @author https://github.com/plurch
     *
     * @param {string} tableName - The name of the database table
     * @param {string} conflictTarget - The column in the table which has a unique index constraint
     * @param {Object} itemData - a hash of properties to be inserted/updated into the row
     * @returns {Promise} - A Promise which resolves to the inserted/updated row
     */
    client.upsertItem = function upsertItem(tableName, conflictTarget, itemData) {
      const targets = conflictTarget.split(', ');
      const exclusions = Object.keys(itemData)
        .filter(c => targets.indexOf(c) === -1)
        .map(c => client.raw('?? = EXCLUDED.??', [c, c]).toString())
        .join(', ');

      const insertString = client(tableName).insert(itemData).toString();
      const conflictString = client
        .raw(` ON CONFLICT (${conflictTarget}) DO UPDATE SET ${exclusions} RETURNING *;`)
        .toString();
      const query = (insertString + conflictString).replace(/\?/g, '\\?');

      return client.raw(query).then(result => result.rows[0]);
    };
  }

  init() {
    const client = this.client;
    const feeds = client.schema.hasTable('feeds').then((exists) => {
      if (exists) return null;

      return client.schema.createTable('feeds', (table) => {
        table.increments();
        table.string('internal');
        table.string('network');
        table.string('network_id');

        // contains filter settings
        table.jsonb('filter');

        // make sure that each account can only have a unique internal + network + id component
        table.unique(['internal', 'network', 'network_id']);
      });
    });

    const statuses = client.schema.hasTable('statuses').then((exists) => {
      if (exists) return null;

      return client.schema.createTable('statuses', (table) => {
        table.bigInteger('id').primary();
        table.string('date');
        table.string('text');
        table.jsonb('meta');
      });
    });

    return Promise.all([feeds, statuses]);
  }

  fetchFeeds(where) {
    return this.client.select().from('feeds').where(where);
  }

  registerFeed(data) {
    return this.client.upsertItem('feeds', 'internal, network, network_id', data);
  }

  listFeeds(data) {
    const query = this.client('feeds');
    if (data.filter.id) {
      query.where({ id: data.filter.id });
    } else {
      if (data.filter.internal) {
        query.where({ internal: data.filter.internal });
      }
      if (data.filter.network) {
        query.where({ network: data.filter.network });
      }
    }
    return query;
  }

  removeFeed(data) {
    const query = this.client('feeds');
    if (data.id) {
      query.where({ id: data.id });
    } else {
      query.where({ internal: data.internal, network: data.network });
    }
    return query.del();
  }

  insertStatus(data) {
    return this.client.upsertItem('statuses', 'id', data);
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

  removeStatuses(data) {
    return this.client('statuses').whereRaw('meta->>\'account\' = ?', [data.account]).del();
  }
}

module.exports = Storage;
