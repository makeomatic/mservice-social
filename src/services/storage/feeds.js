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

  getByNetworkId(network, networkId) {
    return this
      .knex(this.table)
      .where('network', network)
      .where('network_id', networkId)
      .first();
  }
}

module.exports = Feeds;
