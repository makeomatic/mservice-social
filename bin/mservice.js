#!/usr/bin/env node

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Social = require('../src');

const social = new Social(configuration.get('/'));

social.connect()
  .then(() => {
    const address = social.http.info;
    social.log.info(`connected on ${address.address}:${address.port}`);
  })
  .catch((err) => {
    social.log.fatal('Failed to start service', err);
    setImmediate(() => {
      throw err;
    });
  });
