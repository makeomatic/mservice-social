const { faker } = require('@faker-js/faker');
const { getRandomInt, getDateString } = require("../util");

module.exports = function(screenName) {
  const id = getRandomInt()
  return {
    "id": id,
    "id_str": `${id}`,
    "name": faker.person.fullName(),
    "screen_name": screenName,
    "location": faker.location.country() + ", " + faker.location.city(),
    "description": faker.person.jobDescriptor(),
    "url": null,
    "entities": {
      "description": {
        "urls": []
      }
    },
    "protected": false,
    "followers_count": 105,
    "friends_count": 157,
    "listed_count": 3,
    "created_at": getDateString(),
    "favourites_count": 59,
    "utc_offset": null,
    "time_zone": null,
    "geo_enabled": true,
    "verified": false,
    "statuses_count": 146,
    "lang": null,
    "status": null,
    "contributors_enabled": false,
    "is_translator": false,
    "is_translation_enabled": false,
    "profile_background_color": "C0DEED",
    "profile_background_image_url": "http://abs.twimg.com/images/themes/theme1/bg.png",
    "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme1/bg.png",
    "profile_background_tile": false,
    "profile_image_url": "http://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg",
    "profile_image_url_https": "https://pbs.twimg.com/profile_images/1540076330191974400/hwpwsAJg_normal.jpg",
    "profile_banner_url": "https://pbs.twimg.com/profile_banners/2533316504/1404549458",
    "profile_link_color": "000000",
    "profile_sidebar_border_color": "C0DEED",
    "profile_sidebar_fill_color": "DDEEF6",
    "profile_text_color": "333333",
    "profile_use_background_image": true,
    "has_extended_profile": false,
    "default_profile": false,
    "default_profile_image": false,
    "following": false,
    "follow_request_sent": false,
    "notifications": false,
    "translator_type": "none",
    "withheld_in_countries": [],
    "suspended": false,
    "needs_phone_verification": false
  }
}