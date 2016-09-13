class Feed {
  constructor(storage, twitter) {
    this.storage = storage;
    this.twitter = twitter;
  }

  register(data) {
    const { storage, twitter } = this;
    return storage.registerFeed(data).then((result) => (twitter.init().return(result)));
  }

  list(data) {
    return this.storage.listFeeds(data);
  }

  read(data) {
    return this.storage.readStatuses(data);
  }
}

module.exports = Feed;
