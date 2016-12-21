class FacebookMedia {
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
      .orderBy('created_time', sortDirection)
      .limit(page.size);

    if (filter.pageId) {
      query.where('page_id', filter.pageId);
    }

    if (page.cursor) {
      query.where('created_time', cursorDirection, page.cursor);
    }

    return query.select();
  }

  getLast(pageId) {
    return this
      .knex(this.table)
      .where('page_id', pageId)
      .orderBy('created_time', 'desc')
      .first();
  }

  save(data) {
    return this.knex.upsertItem(this.table, 'page_id, id', data);
  }

  delete(postId, pageId) {
    return this
      .knex(this.table)
      .where('id', postId)
      .where('page_id', pageId)
      .del();
  }
}

module.exports = FacebookMedia;
