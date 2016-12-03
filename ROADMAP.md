* API documentation for `feed.register` action
* add index for `statuses` table
* add index for `instagram_media` table
* move tests from `02.instagram` to separate files
* facebook
  * webhook post edit
  * webhook post delete
  * appsecret_proof
  * rate limit
  * unsubscribe app if remove feed




Error performing operation ExpectationError:

Unexpected call: get({\n  json: true,\n  qs: {\n    __paging_token: \"pageToken1\",\n    access_token: \"token1\",\n    appsecret_proof: \"fc33475ced8abe62f65ef09843c6cb2767e562eb424fa859c3ec47fc1d6e9cd7\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: \"100\"\n  },\n  url: \"https://graph.facebook.com/v2.8/11480787104110/feed\"\n})\n    

Expectation met: get({\n  json: true,\n  qs: {\n    access_token: \"token1\",\n    appsecret_proof: \"fc33475ced8abe62f65ef09843c6cb2767e562eb424fa859c3ec47fc1d6e9cd7\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: 100\n  },\n  url: \"https://graph.facebook.com/v2.8/11480787104110/feed\"\n}[, ...]) once\n    

Expected get({\n  json: true,\n  qs: {\n    __paging_token: \"pageToken1\",\n    access_token: \"token1\",\n    appsecret_proof: \"fc33475ced8abe62f65ef09843c6cb2767e562eb424fa859c3ec47fc1d6e9cd7\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: 100\n  },\n  url: \"https://graph.facebook.com/v2.8/11480787104110/feed\"\n}[, ...]) once (never called)\n    Expected get({\n  json: true,\n  qs: {\n    __paging_token: \"pageToken2\",\n    access_token: \"token1\",\n    appsecret_proof: \"fc33475ced8abe62f65ef09843c6cb2767e562eb424fa859c3ec47fc1d6e9cd7\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: 100\n  },\n  url: \"https://graph.facebook.com/v2.8/11480787104110/feed\"\n}[, ...]) once (never called)\n    Expectation met: get({\n  json: true,\n  qs: {\n    access_token: \"token2\",\n    appsecret_proof: \"e022c8200d528ff36b005ae3c4d1ab87281f1d4a2daef5e6697e7c8a5f90ff30\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: 100\n  },\n  url: \"https://graph.facebook.com/v2.8/21480787104110/feed\"\n}[, ...]) once\n    Expected get({\n  json: true,\n  qs: {\n    __paging_token: \"pageToken3\",\n    access_token: \"token2\",\n    appsecret_proof: \"e022c8200d528ff36b005ae3c4d1ab87281f1d4a2daef5e6697e7c8a5f90ff30\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: 100\n  },\n  url: \"https://graph.facebook.com/v2.8/21480787104110/feed\"\n}[, ...]) once (never called)\n    Expected get({\n  json: true,\n  qs: {\n    __paging_token: \"pageToken4\",\n    access_token: \"token2\",\n    appsecret_proof: \"e022c8200d528ff36b005ae3c4d1ab87281f1d4a2daef5e6697e7c8a5f90ff30\",\n    fields: \"attachments,message,story,picture,link\",\n    limit: 100\n  },\n  url: \"https://graph.facebook.com/v2.8/21480787104110/feed\"\n}[, ...]) once (never called)
