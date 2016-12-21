* (!) add index for `facebook_media` table (page_id, created_time DESC)
* API documentation for `feed.register` action
* add index for `statuses` table
* add index for `instagram_media` table
* move tests from `02.instagram` to separate files
* facebook
  * deauthorize callback




Unexpected call: get({\n  json: true,\n  qs: {\n    __paging_token: \"pageToken1\",\n    access_token: \"token3\",\n    appsecret_proof: \"28949670d6cd66940d56d251d9e15838ad27b2b6458f94aba4964e3a703db4ad\",\n    fields: \"attachments,message,story,picture,link,created_time\",\n    limit: \"100\"\n  },\n  url: \"https://graph.facebook.com/v2.8/11482336564985/feed\"\n})\n    

Expectation met: get({\n  json: true,\n  qs: {\n    access_token: \"token3\",\n    appsecret_proof: \"28949670d6cd66940d56d251d9e15838ad27b2b6458f94aba4964e3a703db4ad\",\n    fields: \"attachments,message,story,picture,link,created_time\",\n    limit: \"100\"\n  },\n  url: \"https://graph.facebook.com/v2.8/11482336564985/feed\"\n}[, ...]) once\n    

Expectation met: get({\n  json: true,\n  qs: {\n    access_token: \"token4\",\n    appsecret_proof: \"226d3d182edffa92ce2a7c3578b5808a2b025b3743677b8f841e058b9cf41dba\",\n    fields: \"attachments,message,story,picture,link,created_time\",\n    limit: \"100\"\n  },\n  url: \"https://graph.facebook.com/v2.8/21482336564985/feed\"\n}[, ...]) once
