class Media {
  constructor(knex) {
    this.knex = knex;
  }

  list(params) {
    const { filter, page, sort } = params;
    const sortDirection = sort[0] === '-' ? 'desc' : 'asc';
    const cursorDirection = sort[0] === '-' ? '<' : '>';
    const query = this
      .knex('instagram_media')
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
}

module.exports = Media;
