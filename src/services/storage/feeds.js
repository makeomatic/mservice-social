const is = require('is');

class Feeds {
  constructor(knex, table) {
    this.knex = knex;
    this.table = table;
  }

  fetch(where) {
    return this.knex
      .select()
      .from(this.table)
      .where(where);
  }

  saveCursor(cursor, networkId, network) {
    return this
      .knex(this.table)
      .where('network', network)
      .where('network_id', networkId)
      .whereRaw('cursor < ?', [cursor])
      .update('cursor', cursor);
  }

  async accountsCursor(accounts, network) {
    const cursors = await this.knex
      .select('network_id', 'cursor')
      .from(this.table)
      .where('network', network)
      .whereNotNull('cursor')
      .whereIn('network_id', accounts.map(({ id }) => id));

    return Object.fromEntries(cursors.map((feed) => ([feed.network_id, feed.cursor])));
  }

  save(data) {
    return this.knex.upsertItem(this.table, 'internal, network, network_id', data);
  }

  list(data) {
    const query = this.knex
      .select()
      .from(this.table);

    if (data.filter.id) {
      query.where({ id: data.filter.id });
    } else {
      if (data.filter.internal) {
        query.where({ internal: data.filter.internal });
      }
      if (data.filter.network) {
        query.where({ network: data.filter.network });
      }

      if (is.bool(data.filter.invalid)) {
        query.where({ invalid: data.filter.invalid });
      }
    }

    return query;
  }

  remove(data) {
    const query = this.knex
      .select()
      .from(this.table);

    if (data.id) {
      query.where({ id: data.id });
    } else {
      query.where({ internal: data.internal, network: data.network });
    }

    return query.del();
  }

  invalidate(network, accessToken, tokenField = 'token') {
    return this
      .knex(this.table)
      .where('network', network)
      .whereRaw('meta->>? = ?', [tokenField, accessToken])
      .update('invalid', true);
  }

  getByNetworkId(network, networkId) {
    return this
      .knex(this.table)
      .where('network', network)
      .where('network_id', networkId)
      .first();
  }
}

module.exports = Feeds;
