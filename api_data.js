define({ "api": [
  {
    "type": "http",
    "url": "<prefix>.facebook.media.list",
    "title": "Get list of media",
    "version": "1.0.0",
    "name": "facebook_media_list",
    "group": "Facebook",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "filter",
            "defaultValue": "{}",
            "description": "<p>Filter of query, at least one required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter.pageId",
            "description": "<p>Identificator of <code>facebook</code> page</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "page",
            "defaultValue": "{}",
            "description": "<p>Pagination options</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "page.cursor",
            "description": "<p>Cursor for pagination</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "size": "1 - 100",
            "optional": true,
            "field": "page.size",
            "defaultValue": "20",
            "description": "<p>Number of results</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"created_time\"",
              "\"-created_time\""
            ],
            "optional": true,
            "field": "sort",
            "defaultValue": "-created_time",
            "description": "<p>Field for sorting</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/facebook/media.list.js",
    "groupTitle": "Facebook"
  },
  {
    "type": "http",
    "url": "<prefix>.facebook.webhook",
    "title": "Verify subscription, save media from facebook",
    "version": "1.0.0",
    "name": "facebook_webhook",
    "group": "Facebook",
    "filename": "../src/actions/facebook/webhook.js",
    "groupTitle": "Facebook"
  },
  {
    "type": "http",
    "url": "<prefix>.feed.list",
    "title": "List feeds registered in the system",
    "version": "1.0.0",
    "name": "feed_list",
    "group": "Feed",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "filter",
            "description": "<p>Search clauses</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter.internal",
            "description": "<p>Internal ID to fetch feeds for, if omitted, list all feeds</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter.network",
            "description": "<p>Network to fetch feeds for</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "filter.id",
            "description": "<p>Return just a single feed with this ID</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "meta",
            "description": "<p>Collection metadata</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "meta.count",
            "description": "<p>Count of results</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "meta.before",
            "description": "<p>64 bit tweet string id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "meta.cursor",
            "description": "<p>64 bit tweet string id</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Collection of feeds list of registered social feeds</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.id",
            "description": "<p>internal auto-increment id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"feed\""
            ],
            "optional": false,
            "field": "data.type",
            "description": "<p>type of entity</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "data.attributes",
            "description": "<p>feed properties</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.internal",
            "description": "<p>owner of the feed, in the future should ref organization</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"twitter\""
            ],
            "optional": true,
            "field": "data.attributes.network",
            "description": "<p>network for which this feed is returned</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.network_id",
            "description": "<p>internal network id of the feed</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": true,
            "field": "data.attributes.filter",
            "description": "<p>filter, which is used when returning data from the feed</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/feed.list.js",
    "groupTitle": "Feed"
  },
  {
    "type": "http",
    "url": "<prefix>.feed.read",
    "title": "Read feed by account with optional filters",
    "version": "1.0.0",
    "name": "feed_read",
    "group": "Feed",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": false,
            "field": "filter",
            "description": "<p>What to fetch, filters are cumulative (e.g. shows statuses for account id that have mentions)</p>"
          },
          {
            "group": "Parameter",
            "type": "Unknown",
            "optional": true,
            "field": "filter.account",
            "description": "<p>Account ID (for twitter — username) to fetch feed for</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "filter.mentions",
            "description": "<p>Array of mentions to search for undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "String[]",
            "optional": true,
            "field": "filter.hashtags",
            "description": "<p>Array of hashtags to search for undefined</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": true,
            "field": "filter.page",
            "defaultValue": "0",
            "description": "<p>Page number, 0 by default</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "optional": true,
            "field": "filter.pageSize",
            "defaultValue": "25",
            "description": "<p>Amount of items per page, 25 by default</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter.cursor",
            "description": "<p>Pass biggest internal status id for consistent pagination</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"desc\"",
              "\"asc\""
            ],
            "optional": true,
            "field": "filter.order",
            "defaultValue": "desc",
            "description": "<p>undefined</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "meta",
            "description": "<p>Collection metadata</p>"
          },
          {
            "group": "Success 200",
            "type": "Integer",
            "optional": false,
            "field": "meta.count",
            "description": "<p>Count of results</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "meta.before",
            "description": "<p>64 bit tweet string id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "meta.cursor",
            "description": "<p>64 bit tweet string id</p>"
          },
          {
            "group": "Success 200",
            "type": "Object[]",
            "optional": false,
            "field": "data",
            "description": "<p>Collection of tweets <code>tweet</code> object</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.id",
            "description": "<p>64 bit tweet string id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "allowedValues": [
              "\"tweet\""
            ],
            "optional": false,
            "field": "data.type",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "data.attributes",
            "description": "<p>Tweet Properties</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.id",
            "description": "<p>64 bit tweet string id</p>"
          },
          {
            "group": "Success 200",
            "type": "Date",
            "optional": true,
            "field": "data.attributes.date",
            "description": "<p>date posted</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.text",
            "description": "<p>tweet body</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": true,
            "field": "data.attributes.meta",
            "description": "<p>undefined</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.meta.id_str",
            "description": "<p>original tweet id</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.meta.account",
            "description": "<p>account feed owner</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": true,
            "field": "data.attributes.meta.account_id",
            "description": "<p>account string id</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": true,
            "field": "data.attributes.meta.entities",
            "description": "<p>meta information of the embedded tweet</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/feed.read.js",
    "groupTitle": "Feed"
  },
  {
    "type": "http",
    "url": "<prefix>.feed.register",
    "title": "Register new feed source",
    "version": "1.0.0",
    "name": "feed_register",
    "group": "Feed",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "internal",
            "description": "<p>Internal ID to assign this feed to</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"twitter\"",
              "\"instagram\"",
              "\"facebook\""
            ],
            "optional": false,
            "field": "network",
            "description": "<p>Social network to fetch feed from</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "optional": false,
            "field": "accounts",
            "description": "<p>undefined undefined</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/feed.register.js",
    "groupTitle": "Feed"
  },
  {
    "type": "amqp",
    "url": "<prefix>.feed.remove",
    "title": "Remove feed",
    "version": "1.0.0",
    "name": "feed_remove",
    "group": "Feed",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "internal",
            "description": "<p>Internal ID to use in combination with network</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "network",
            "description": "<p>Social network to use in combination with internal</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "id",
            "description": "<p>Or exact feed ID</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "optional": true,
            "field": "keep_data",
            "defaultValue": "false",
            "description": "<p>If true, feed will be removed and not synced anymore, but old data will be left available</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/feed.remove.js",
    "groupTitle": "Feed"
  },
  {
    "type": "http",
    "url": "<prefix>.instagram.media.list",
    "title": "Get list of media",
    "version": "1.0.0",
    "name": "instagram_media_list",
    "group": "Instagram",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "filter",
            "defaultValue": "{}",
            "description": "<p>Filter of query, at least one required</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "filter.accountId",
            "description": "<p>Identificator of <code>instagram</code> account</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "optional": true,
            "field": "page",
            "defaultValue": "{}",
            "description": "<p>Pagination options</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "page.cursor",
            "description": "<p>Cursor for pagination</p>"
          },
          {
            "group": "Parameter",
            "type": "Integer",
            "size": "1 - 100",
            "optional": true,
            "field": "page.size",
            "defaultValue": "20",
            "description": "<p>Number of results</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "allowedValues": [
              "\"id\"",
              "\"-id\""
            ],
            "optional": true,
            "field": "sort",
            "defaultValue": "-id",
            "description": "<p>Field for sorting</p>"
          }
        ]
      }
    },
    "filename": "../src/actions/instagram/media.list.js",
    "groupTitle": "Instagram"
  }
] });
