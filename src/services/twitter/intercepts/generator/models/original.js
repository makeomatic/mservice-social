
const { getRandomInt, getDateString } = require("../util");
const { faker } = require("@faker-js/faker");

module.exports = function(user, mentions, options = {}) {
  const id = options.id ?? getRandomInt()
  return {
    created_at: getDateString(),
    // eslint-disable-next-line no-loss-of-precision
    id: id,
    id_str: `${id}`,
    text: faker.lorem.sentence(10),
    truncated: false,
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: mentions,
      urls: [],
    },
    source: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
    in_reply_to_status_id: null,
    in_reply_to_status_id_str: null,
    in_reply_to_user_id: null,
    in_reply_to_user_id_str: null,
    in_reply_to_screen_name: null,
    user: user,
    geo: null,
    coordinates: null,
    place: null,
    contributors: null,
    is_quote_status: false,
    retweet_count: 1,
    favorite_count: 1,
    favorited: false,
    retweeted: false,
    lang: 'en',
  };
}
