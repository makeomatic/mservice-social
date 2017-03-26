#!/usr/bin/env node

/* eslint-disable import/no-dynamic-require */

// accepts conf through .env file
// suitable for configuring this in the docker env
const configuration = require('ms-conf');

let dir = '../lib';
try {
  require('babel-register');
  dir = '../src';
} catch (e) {
  // prod env
}

const Social = require(dir);
const social = new Social(configuration.get('/'));

social.connect()
  .then(() => {
    const address = social.http.info;
    return social.log.info(`connected on ${address.address}:${address.port}`);
  })
  .catch((err) => {
    social.log.fatal('Failed to start service', err);
    setImmediate(() => { throw err; });
  });
