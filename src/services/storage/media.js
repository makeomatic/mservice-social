class Media {
  constructor(knex, table) {
    this.knex = knex;
    this.table = table;
  }

  list(params) {
    const { filter, page, sort } = params;
    const sortDirection = sort[0] === '-' ? 'desc' : 'asc';
    const cursorDirection = sort[0] === '-' ? '<' : '>';
    const query = this
      .knex(this.table)
      .orderBy('id', sortDirection)
      .limit(page.size);

    if (filter.accountId) {
      query.where('user_id', filter.accountId);
    }

    if (page.cursor) {
      query.where('id', cursorDirection, page.cursor);
    }

    return query.select();
  }

  getLastId(userId) {
    return this
      .knex(this.table)
      .where('user_id', userId)
      .orderBy('id', 'desc')
      .first('id')
      .then(media => (media ? media.id : null));
  }

  save(data) {
    return this.knex
      .insert(data, '*')
      .into(this.table);
  }
}

module.exports = Media;
