const nock = require('nock');
const url = require('url');
const debug = require('debug');

const log = debug('twitter:intercept');

function createUser(screenName) {
  return {
    id: 2533316504,
    id_str: '2533316504',
    name: 'random name',
    screen_name: screenName,
    location: 'Vancouver, British Columbia',
    description: 'CTO at @streamlayer, Founder @Makeomatic Software Architect. Speaker',
    url: null,
    entities: {
      description: {
        urls: [],
      },
    },
    protected: false,
    followers_count: 105,
    friends_count: 157,
    listed_count: 3,
    created_at: 'Thu May 29 20:07:42 +0000 2014',
    favourites_count: 59,
    utc_offset: null,
    time_zone: null,
    geo_enabled: true,
    verified: false,
    statuses_count: 146,
    lang: null,
    status: {
      created_at: 'Tue Feb 07 00:32:46 +0000 2023',
      id: 1622755209964568576,
      id_str: '1622755209964568576',
      text: '@mikeal @nodejs Would love to go. Nostalgic vibes with similar outdoor activities :)',
      truncated: false,
      entities: {
        hashtags: [],
        symbols: [],
        user_mentions: [
          {
            screen_name: 'mikeal',
            name: 'Mikeal Rogers',
            id: 668423,
            id_str: '668423',
            indices: [
              0,
              7,
            ],
          },
          {
            screen_name: 'nodejs',
            name: 'Node.js',
            id: 91985735,
            id_str: '91985735',
            indices: [
              8,
              15,
            ],
          },
        ],
        urls: [],
      },
      source: '<a href="http://twitter.com/download/iphone" rel="nofollow">Twitter for iPhone</a>',
      in_reply_to_status_id: 1622624107270664192,
      in_reply_to_status_id_str: '1622624107270664192',
      in_reply_to_user_id: 668423,
      in_reply_to_user_id_str: '668423',
      in_reply_to_screen_name: 'mikeal',
      geo: null,
      coordinates: null,
      place: null,
      contributors: null,
      is_quote_status: false,
      retweet_count: 0,
      favorite_count: 2,
      favorited: false,
      retweeted: false,
      lang: 'en',
    },
    contributors_enabled: false,
    is_translator: false,
    is_translation_enabled: false,
    profile_background_color: 'C0DEED',
    profile_background_image_url: 'http://abs.twimg.com/images/themes/theme1/bg.png',
    profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme1/bg.png',
    profile_background_tile: false,
    profile_image_url: 'http://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
    profile_image_url_https: 'https://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
    profile_banner_url: 'https://pbs.twimg.com/profile_banners/2533316504/1404549458',
    profile_link_color: '000000',
    profile_sidebar_border_color: 'C0DEED',
    profile_sidebar_fill_color: 'DDEEF6',
    profile_text_color: '333333',
    profile_use_background_image: true,
    has_extended_profile: false,
    default_profile: false,
    default_profile_image: false,
    following: false,
    follow_request_sent: false,
    notifications: false,
    translator_type: 'none',
    withheld_in_countries: [],
    suspended: false,
    needs_phone_verification: false,
  };
}

function createTwitStatusObjectMock(
  screenName,
  options = { reply: false }
) {
  return {
    created_at: 'Wed Oct 10 20:19:24 +0000 2018',
    id: 1050118621198921728,
    id_str: '1050118621198921728',
    text: 'To make room for more expression, we will now count all '
      + 'emojis as equal—including those with gender‍‍‍ and skin t… https://t.co/MkGjXf9aXm',
    truncated: true,
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: [],
      urls: [
        {
          url: 'https://t.co/MkGjXf9aXm',
          expanded_url: 'https://twitter.com/i/web/status/1050118621198921728',
          display_url: 'twitter.com/i/web/status/1…',
          indices: [
            117,
            140,
          ],
        },
      ],
    },
    source: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
    user: {
      id: 1,
      id_str: '1',
      name: 'Twitter API',
      screen_name: screenName,
      location: 'San Francisco, CA',
      description: 'The Real Twitter API. Tweets about API changes, service issues and '
        + "our Developer Platform. Don't get an answer? It's on my website.",
      url: 'https://t.co/8IkCzCDr19',
      entities: {
        url: {
          urls: [
            {
              url: 'https://t.co/8IkCzCDr19',
              expanded_url: 'https://developer.twitter.com',
              display_url: 'developer.twitter.com',
              indices: [
                0,
                23,
              ],
            },
          ],
        },
        description: {
          urls: [],
        },
      },
      protected: false,
      followers_count: 6128663,
      friends_count: 12,
      listed_count: 12900,
      created_at: 'Wed May 23 06:01:13 +0000 2007',
      favourites_count: 32,
      utc_offset: null,
      time_zone: null,
      geo_enabled: null,
      verified: true,
      statuses_count: 3659,
      lang: 'null',
      contributors_enabled: null,
      is_translator: null,
      is_translation_enabled: null,
      profile_background_color: 'null',
      profile_background_image_url: 'null',
      profile_background_image_url_https: 'null',
      profile_background_tile: null,
      profile_image_url: 'null',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/942858479592554497/BbazLO9L_normal.jpg',
      profile_banner_url: 'https://pbs.twimg.com/profile_banners/6253282/1497491515',
      profile_link_color: 'null',
      profile_sidebar_border_color: 'null',
      profile_sidebar_fill_color: 'null',
      profile_text_color: 'null',
      profile_use_background_image: null,
      has_extended_profile: null,
      default_profile: false,
      default_profile_image: false,
      following: null,
      follow_request_sent: null,
      notifications: null,
      translator_type: 'null',
    },
    geo: null,
    coordinates: null,
    place: null,
    contributors: null,
    is_quote_status: false,
    retweet_count: 161,
    favorite_count: 296,
    favorited: false,
    retweeted: false,
    possibly_sensitive: false,
    possibly_sensitive_appealable: false,
    lang: 'en',
    ...options.reply ? {
      in_reply_to_status_id: null,
      in_reply_to_status_id_str: null,
      in_reply_to_user_id: 1,
      in_reply_to_user_id_str: null,
      in_reply_to_screen_name: null,
    } : {},
  };
}

function createReply() {
  return {
    created_at: 'Sat Oct 15 17:50:29 +0000 2016',
    // eslint-disable-next-line no-loss-of-precision
    id: 787349945225515008,
    id_str: '787349945225515008',
    text: '@NodeConfEU team @MakeOmatic is in Dublin. Heading to get some dinner soon, any1 who wants to join is very welcome :)',
    truncated: false,
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: [
        {
          screen_name: 'NodeConfEU',
          name: 'NodeConf EU Nov 6th-8th 2023',
          id: 526867353,
          id_str: '526867353',
          indices: [
            0,
            11,
          ],
        },
        {
          screen_name: 'MakeOmatic',
          name: 'makeomatic',
          id: 1960663927,
          id_str: '1960663927',
          indices: [
            17,
            28,
          ],
        },
      ],
      urls: [],
    },
    source: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
    // eslint-disable-next-line no-loss-of-precision
    in_reply_to_status_id: 1621960453323735041,
    in_reply_to_status_id_str: '1621960453323735041',
    in_reply_to_user_id: 356087317,
    in_reply_to_user_id_str: '356087317',
    in_reply_to_screen_name: 's_gimeno',
    user: {
      id: 2533316504,
      id_str: '2533316504',
      name: 'Vitaly Aminev @ Vancouver 🇨🇦',
      screen_name: 'v_aminev',
      location: 'Vancouver, British Columbia',
      description: 'CTO at @streamlayer, Founder @Makeomatic Software Architect. Speaker',
      url: null,
      entities: {
        description: {
          urls: [],
        },
      },
      protected: false,
      followers_count: 105,
      friends_count: 157,
      listed_count: 3,
      created_at: 'Thu May 29 20:07:42 +0000 2014',
      favourites_count: 59,
      utc_offset: null,
      time_zone: null,
      geo_enabled: true,
      verified: false,
      statuses_count: 146,
      lang: null,
      contributors_enabled: false,
      is_translator: false,
      is_translation_enabled: false,
      profile_background_color: 'C0DEED',
      profile_background_image_url: 'http://abs.twimg.com/images/themes/theme1/bg.png',
      profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme1/bg.png',
      profile_background_tile: false,
      profile_image_url: 'http://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
      profile_banner_url: 'https://pbs.twimg.com/profile_banners/2533316504/1404549458',
      profile_link_color: '000000',
      profile_sidebar_border_color: 'C0DEED',
      profile_sidebar_fill_color: 'DDEEF6',
      profile_text_color: '333333',
      profile_use_background_image: true,
      has_extended_profile: false,
      default_profile: false,
      default_profile_image: false,
      following: false,
      follow_request_sent: false,
      notifications: false,
      translator_type: 'none',
      withheld_in_countries: [],
    },
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

function createOriginal() {
  return {
    created_at: 'Sat Oct 15 17:50:29 +0000 2016',
    // eslint-disable-next-line no-loss-of-precision
    id: 787349945225515001,
    id_str: '787349945225515001',
    text: '@NodeConfEU team @MakeOmatic is in Dublin. Heading to get some dinner soon, any1 who wants to join is very welcome :)',
    truncated: false,
    entities: {
      hashtags: [],
      symbols: [],
      user_mentions: [
        {
          screen_name: 'NodeConfEU',
          name: 'NodeConf EU Nov 6th-8th 2023',
          id: 526867353,
          id_str: '526867353',
          indices: [
            0,
            11,
          ],
        },
        {
          screen_name: 'MakeOmatic',
          name: 'makeomatic',
          id: 1960663927,
          id_str: '1960663927',
          indices: [
            17,
            28,
          ],
        },
      ],
      urls: [],
    },
    source: '<a href="http://twitter.com" rel="nofollow">Twitter Web Client</a>',
    // "in_reply_to_status_id": null,
    // "in_reply_to_status_id_str": null,
    // "in_reply_to_user_id": null,
    // "in_reply_to_user_id_str": null,
    // "in_reply_to_screen_name": null,
    user: {
      id: 2533316504,
      id_str: '2533316504',
      name: 'Vitaly Aminev @ Vancouver 🇨🇦',
      screen_name: 'v_aminev',
      location: 'Vancouver, British Columbia',
      description: 'CTO at @streamlayer, Founder @Makeomatic Software Architect. Speaker',
      url: null,
      entities: {
        description: {
          urls: [],
        },
      },
      protected: false,
      followers_count: 105,
      friends_count: 157,
      listed_count: 3,
      created_at: 'Thu May 29 20:07:42 +0000 2014',
      favourites_count: 59,
      utc_offset: null,
      time_zone: null,
      geo_enabled: true,
      verified: false,
      statuses_count: 146,
      lang: null,
      contributors_enabled: false,
      is_translator: false,
      is_translation_enabled: false,
      profile_background_color: 'C0DEED',
      profile_background_image_url: 'http://abs.twimg.com/images/themes/theme1/bg.png',
      profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme1/bg.png',
      profile_background_tile: false,
      profile_image_url: 'http://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
      profile_banner_url: 'https://pbs.twimg.com/profile_banners/2533316504/1404549458',
      profile_link_color: '000000',
      profile_sidebar_border_color: 'C0DEED',
      profile_sidebar_fill_color: 'DDEEF6',
      profile_text_color: '333333',
      profile_use_background_image: true,
      has_extended_profile: false,
      default_profile: false,
      default_profile_image: false,
      following: false,
      follow_request_sent: false,
      notifications: false,
      translator_type: 'none',
      withheld_in_countries: [],
    },
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

function createRetweet() {
  return {
    created_at: 'Tue Jan 31 22:17:00 +0000 2023',
    // eslint-disable-next-line no-loss-of-precision
    id: 1620546716373254144,
    id_str: '1620546716373254144',
    text: 'RT @amineva_art: •Making mixed #media #artwork by playing around with its background. Fisrt #NFT '
      + 'collection drops soon•\n#digitalart #nftcol…',
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
      user_mentions: [
        {
          screen_name: 'amineva_art',
          name: 'Anya',
          id: 271456488,
          id_str: '271456488',
          indices: [
            3,
            15,
          ],
        },
      ],
      urls: [],
    },
    source: '<a href="http://twitter.com/download/iphone" rel="nofollow">Twitter for iPhone</a>',
    in_reply_to_status_id: null,
    in_reply_to_status_id_str: null,
    in_reply_to_user_id: null,
    in_reply_to_user_id_str: null,
    in_reply_to_screen_name: null,
    user: {
      id: 2533316504,
      id_str: '2533316504',
      name: 'Vitaly Aminev @ Vancouver 🇨🇦',
      screen_name: 'v_aminev',
      location: 'Vancouver, British Columbia',
      description: 'CTO at @streamlayer, Founder @Makeomatic Software Architect. Speaker',
      url: null,
      entities: {
        description: {
          urls: [],
        },
      },
      protected: false,
      followers_count: 105,
      friends_count: 157,
      listed_count: 3,
      created_at: 'Thu May 29 20:07:42 +0000 2014',
      favourites_count: 59,
      utc_offset: null,
      time_zone: null,
      geo_enabled: true,
      verified: false,
      statuses_count: 146,
      lang: null,
      contributors_enabled: false,
      is_translator: false,
      is_translation_enabled: false,
      profile_background_color: 'C0DEED',
      profile_background_image_url: 'http://abs.twimg.com/images/themes/theme1/bg.png',
      profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme1/bg.png',
      profile_background_tile: false,
      profile_image_url: 'http://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg',
      profile_banner_url: 'https://pbs.twimg.com/profile_banners/2533316504/1404549458',
      profile_link_color: '000000',
      profile_sidebar_border_color: 'C0DEED',
      profile_sidebar_fill_color: 'DDEEF6',
      profile_text_color: '333333',
      profile_use_background_image: true,
      has_extended_profile: false,
      default_profile: false,
      default_profile_image: false,
      following: false,
      follow_request_sent: false,
      notifications: false,
      translator_type: 'none',
      withheld_in_countries: [],
    },
    geo: null,
    coordinates: null,
    place: null,
    contributors: null,
    retweeted_status: {
      created_at: 'Fri Jan 27 02:00:01 +0000 2023',
      // eslint-disable-next-line no-loss-of-precision
      id: 1618790903912480768,
      id_str: '1618790903912480768',
      text: '•Making mixed #media #artwork by playing around with its background. '
        + 'Fisrt #NFT collection drops soon•\n#digitalart… https://t.co/te1xkATUVG',
      truncated: true,
      entities: {
        hashtags: [
          {
            text: 'media',
            indices: [
              14,
              20,
            ],
          },
          {
            text: 'artwork',
            indices: [
              21,
              29,
            ],
          },
          {
            text: 'NFT',
            indices: [
              75,
              79,
            ],
          },
          {
            text: 'digitalart',
            indices: [
              103,
              114,
            ],
          },
        ],
        symbols: [],
        user_mentions: [],
        urls: [
          {
            url: 'https://t.co/te1xkATUVG',
            expanded_url: 'https://twitter.com/i/web/status/1618790903912480768',
            display_url: 'twitter.com/i/web/status/1…',
            indices: [
              116,
              139,
            ],
          },
        ],
      },
      source: '<a href="https://www.feedhive.com" rel="nofollow">FeedHive</a>',
      in_reply_to_status_id: null,
      in_reply_to_status_id_str: null,
      in_reply_to_user_id: null,
      in_reply_to_user_id_str: null,
      in_reply_to_screen_name: null,
      user: {
        id: 271456488,
        id_str: '271456488',
        name: 'Anya',
        screen_name: 'amineva_art',
        location: 'Vancouver',
        description: 'NFT artist / Illustrator / Painter / Animator. In love with digital creatures. '
          + 'Design Evangelist / Founder at https://t.co/GtOcuhBqNf 🇨🇦 Instagram: @amineva_art',
        url: null,
        entities: {
          description: {
            urls: [
              {
                url: 'https://t.co/GtOcuhBqNf',
                expanded_url: 'http://Makeomatic.ca',
                display_url: 'Makeomatic.ca',
                indices: [
                  110,
                  133,
                ],
              },
            ],
          },
        },
        protected: false,
        followers_count: 94,
        friends_count: 88,
        listed_count: 3,
        created_at: 'Thu Mar 24 15:00:47 +0000 2011',
        favourites_count: 55,
        utc_offset: null,
        time_zone: null,
        geo_enabled: true,
        verified: false,
        statuses_count: 549,
        lang: null,
        contributors_enabled: false,
        is_translator: false,
        is_translation_enabled: false,
        profile_background_color: '0A0A0A',
        profile_background_image_url: 'http://abs.twimg.com/images/themes/theme1/bg.png',
        profile_background_image_url_https: 'https://abs.twimg.com/images/themes/theme1/bg.png',
        profile_background_tile: true,
        profile_image_url: 'http://pbs.twimg.com/profile_images/1577656071539363845/9cBL_BeW_normal.jpg',
        profile_image_url_https: 'https://pbs.twimg.com/profile_images/1577656071539363845/9cBL_BeW_normal.jpg',
        profile_banner_url: 'https://pbs.twimg.com/profile_banners/271456488/1541105104',
        profile_link_color: '2B59B5',
        profile_sidebar_border_color: 'FFFFFF',
        profile_sidebar_fill_color: 'EADEAA',
        profile_text_color: '333333',
        profile_use_background_image: true,
        has_extended_profile: false,
        default_profile: false,
        default_profile_image: false,
        following: true,
        follow_request_sent: false,
        notifications: false,
        translator_type: 'none',
        withheld_in_countries: [],
      },
      geo: null,
      coordinates: null,
      place: null,
      contributors: null,
      is_quote_status: false,
      retweet_count: 1,
      favorite_count: 9,
      favorited: true,
      retweeted: true,
      possibly_sensitive: false,
      lang: 'en',
    },
    is_quote_status: false,
    retweet_count: 1,
    favorite_count: 0,
    favorited: true,
    retweeted: true,
    lang: 'en',
  };
}

function interceptTwitterApi() {
  log('using twitter api interceptor');
  nock.disableNetConnect()
  nock('https://api.twitter.com')
    .persist()
    .get((uri) => {
      log(`getting request for uri=${uri}`);
      return uri.includes('users/lookup');
    })
    .reply(function (uri, requestBody) {
      log('checkin users/lookup');
      const q = url.parse(uri, true);
      log(`Intercepted GET request to: ${uri}`);
      log('Request body: ', requestBody);
      log(`query:${JSON.stringify(q.query)}`);
      return [200, [createUser(q.query.screen_name)]];
    });

  nock('https://api.twitter.com')
    .persist()
    .get((uri) => {
      log(`getting request for uri=${uri}`);
      return uri.includes('statuses/user_timeline');
    })
    .reply(function (uri, requestBody) {
      log('checkin statuses/user_timeline');
      const q = url.parse(uri, true);
      log(`Intercepted GET request to: ${uri}`);
      log('Request body: ', requestBody);
      log(`query:${JSON.stringify(q.query)}`);
      const response = [
        createOriginal(),
        createReply(),
        createRetweet(),
      ];
      return [200, response];
    });

  nock('https://api.twitter.com')
    .persist()
    .get((uri) => {
      log(1, () => `getting request for uri=${uri}`);
      return uri.includes('statuses/show');
    })
    .reply(function (uri, requestBody) {
      log('checkin statuses/show');
      const q = url.parse(uri, true);
      log(`Intercepted GET request to: ${uri}`);
      log('Request body: ', requestBody);
      log(`query:${JSON.stringify(q.query)}`);
      return [200, createTwitStatusObjectMock('v_aminev')];
    });
}

module.exports = {
  interceptTwitterApi,
};
