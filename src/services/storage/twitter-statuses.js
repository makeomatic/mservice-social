class TwitterStatuses {
  constructor(knex, table) {
    this.knex = knex;
    this.table = table;
  }

  save(data) {
    return this.knex.upsertItem(this.table, 'id', data);
  }

  list(data) {
    const {
      page,
      pageSize,
      cursor,
      order,
    } = data.filter;

    const offset = page * pageSize;

    const rawQuery = Array.isArray(data.filter.account)
      ? 'lower(meta->>\'account\') similar to ?'
      : 'meta->>\'account\' ILIKE ?';
    const account = Array.isArray(data.filter.account) ? `(${data.filter.account.join('|')})`.toLowerCase() : data.filter.account;

    const query = this.knex(this.table)
      .select(this.knex.raw('meta->>\'account\' as account, *'))
      .whereRaw(rawQuery, [account])
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
