const { getRandomInt } = require("../util");
const { faker } = require("@faker-js/faker");

module.exports = function(user, mentions) {
  const id = getRandomInt()
  return {
    created_at: "Wed Jun 06 20:07:10 +0000 2012",
    id: id,
    id_str: `${id}`,
    text: faker.lorem.sentence(10),
    truncated: false,
    entities: {
      hashtags: [
        {
          text: "Twitterbird",
          indices: [
            19,
            31
          ]
        }
      ],
      symbols: [],
      user_mentions: mentions,
      urls: [
        {
          url: "https://t.co/Ed4omjYs",
          expanded_url: "https://dev.twitter.com/terms/display-guidelines",
          display_url: "dev.twitter.com/terms/display-…",
          indices: [
            76,
            97
          ]
        }
      ]
    },
    source: "<a href=\"http://twitter.com\" rel=\"nofollow\">Twitter Web Client</a>",
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
    possibly_sensitive: false,
    possibly_sensitive_appealable: false,
    lang: "en"
  }
}
