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
      .orderBy('id', sortDirection)
      .limit(page.size);

    if (filter.pageId) {
      query.where('page_id', filter.pageId);
    }

    if (page.cursor) {
      query.where('id', cursorDirection, page.cursor);
    }

    return query.select();
  }

  getLastId(pageId) {
    return this
      .knex(this.table)
      .where('page_id', pageId)
      .orderBy('id', 'desc')
      .first('id')
      .then(media => (media ? media.id : null));
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
