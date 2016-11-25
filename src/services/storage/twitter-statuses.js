class TwitterStatuses {
  constructor(knex, table) {
    this.knex = knex;
    this.table = table;
  }

  save(data) {
    return this.knex.upsertItem(this.table, 'id', data);
  }

  list(data) {
    const page = data.filter.page;
    const pageSize = data.filter.pageSize;
    const cursor = data.filter.cursor;
    const offset = page * pageSize;
    const order = data.filter.order;

    const query = this.knex(this.table)
      .select(this.knex.raw('meta->>\'account\' as account, *'))
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

  remove(data) {
    return this.knex(this.table).whereRaw('meta->>\'account\' = ?', [data.account]).del();
  }
}

module.exports = TwitterStatuses;
