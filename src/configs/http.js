module.exports = {
  http: {
    server: {
      handler: 'hapi',
      attachSocketIO: false,
      port: 3000,
    },
    router: {
      enabled: true,
      prefix: 'api',
    },
  },
};
