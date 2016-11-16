class Storage {
  constructor(knex) {
    this.client = knex;
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
    const network = data.filter.network;
    const page = data.filter.page;
    const pageSize = data.filter.pageSize;
    const cursor = data.filter.cursor;
    const offset = page * pageSize;
    const order = data.filter.order;

    const query = this.client('statuses')
      .select(this.client.raw('meta->>\'account\' as account, *'))
      .where('network', network)
      .orderBy('id', order)
      .limit(pageSize)
      .offset(offset);

    if (data.filter.account) {
      query.whereRaw('meta->>\'account\' = ?', [data.filter.account]);
    }

    if (cursor) {
      return order === 'desc'
        ? query.where('id', '<', cursor)
        : query.where('id', '>', cursor);
    }

    return query;
  }

  removeStatuses(data) {
    return this.client('statuses')
      .where('network', data.network)
      .whereRaw('meta->>\'account\' = ?', [data.account])
      .del();
  }
}

module.exports = Storage;
