class TwitterStatuses {
  constructor(knex, table) {
    this.knex = knex;
    this.table = table;
  }

  save(data) {
    return this.knex.upsertItem(this.table, 'id', data);
  }

  async last({ account }) {
    return this.knex(this.table)
      .select()
      .where({ account })
      .orderBy([{ column: 'id', order: 'desc' }])
      .limit(1)
      .first();
  }

  list(data, restrictedTypes = []) {
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
      .whereRaw(rawQuery, [account]);

    if (restrictedTypes.length) {
      query.whereNotIn('type', restrictedTypes);
    }

    query
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

  countByAccount(data) {
    const {
      account,
      cursor,
    } = data;

    const query = this.knex
      .select('account')
      .countDistinct('id')
      .from(this.table)
      .where('account', account)
      .groupBy('account');

    if (cursor) {
      query.where('id', '>', cursor);
    }

    return query;
  }

  countByAccounts(data) {
    const subqueries = data.map(({ account, cursor }) => this.countByAccount({ account, cursor }));
    return this.knex.unionAll(subqueries);
  }

  remove(data) {
    return this.knex(this.table).where('account', data.account).del();
  }

  byId(tweetId) {
    return this.knex(this.table)
      .where('id', tweetId)
      .first();
  }
}

module.exports = TwitterStatuses;
