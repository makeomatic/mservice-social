
const { getRandomInt, getDateString } = require("../util");
const { faker } = require("@faker-js/faker");

module.exports = function(user, mentions, tweet) {
  const id = getRandomInt()
  return {
    created_at: getDateString(),
    // eslint-disable-next-line no-loss-of-precision
    id: id,
    id_str: `${id}`,
    text: faker.lorem.sentence(10),
    truncated: false,
    entities: {
      hashtags: [
        {
          text: 'media',
          indices: [
            31,
            37,
          ],
        },
        {
          text: 'artwork',
          indices: [
            38,
            46,
          ],
        },
        {
          text: 'NFT',
          indices: [
            92,
            96,
          ],
        },
        {
          text: 'digitalart',
          indices: [
            120,
            131,
          ],
        },
      ],
      symbols: [],
      user_mentions: mentions,
      urls: [],
    },
    source: '<a href="http://twitter.com/download/iphone" rel="nofollow">Twitter for iPhone</a>',
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
    retweeted_status: tweet,
    is_quote_status: false,
    retweet_count: 1,
    favorite_count: 0,
    favorited: true,
    retweeted: true,
    lang: 'en',
  };
}
