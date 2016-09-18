#!/usr/bin/env node

const dir = '../src';

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');
const Social = require(dir);
const social = new Social(configuration.get('/'));

social.connect()
  .then(() => {
    const address = social.http.info;
    social.log.info(`connected on ${address.address}:${address.port}`);
  })
  .catch(err => {
    social.log.fatal('Failed to start service', err);
    setImmediate(() => {
      throw err;
    });
  });
