module.exports = {
  facebook: {
    enabled: false,
    syncMediaOnStart: true,
    subscribeOnStart: true,
    api: {
      version: 'v2.8',
      fields: 'attachments,message,story,picture,link,created_time',
    },
    // app: {
    //   id: 'app-id',
    //   secret: 'app-secret',
    // },
    subscriptions: [
      // {
      //   object: 'page',
      //   fields: 'feed',
      //   verifyToken: 'your-verify-token',
      //   callbackUrl: 'https://your.callback/url',
      // },
    ],
  },
};
