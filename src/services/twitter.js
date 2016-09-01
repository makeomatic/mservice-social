const TwitterClient = require('twitter');

/**
 * @property {TwitterClient} client
 */
class Twitter {
  /**
   * @param {object} config
   */
  constructor(config) {
    this.client = new TwitterClient(config);
  }

  /**
   * @param {object} filter
   */
  search(filter) {
    
  }
}

module.exports = Twitter;
