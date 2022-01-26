class TwitterStatuses {
  constructor(knex, table) {
    this.knex = knex;
    this.table = table;
  }

  save(data) {
    return this.knex.upsertItem(this.table, 'id', data);
  }

  markDeleted(data) {
    return this.knex.upsertItem(this.table, 'id', { ...data, is_deleted: true });
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
      ? 'account = ANY(?)'
      : 'account = ?';

    const account = Array.isArray(data.filter.account)
      ? data.filter.account.map((s) => s.toLowerCase())
      : data.filter.account.toLowerCase();

    const query = this.knex(this.table)
      .select()
      .where({ is_deleted: false })
      .whereRaw(rawQuery, [account])
      .orderBy([
        { column: 'id', order },
        { column: 'account' },
      ])
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
    return this.knex(this.table).where('account', data.account).del();
  }

  byId(tweetId) {
    return this.knex(this.table)
      .where({
        id: tweetId,
        is_deleted: false,
      })
      .first();
  }
}

module.exports = TwitterStatuses;
