class Feed {
  constructor(storage) {
    this.storage = storage;
  }

  register(data) {
    return this.storage.registerFeed(data);
  }

  list(data) {
    return this.storage.listFeeds(data);
  }
}

module.exports = Feed;
