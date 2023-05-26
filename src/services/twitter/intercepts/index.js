const nock = require('nock');
const url = require('url');
const debug = require('debug');
const log = debug('twitter:intercept');
const Stream = require('stream');
const fs = require('fs');
const { userFactory, originalFactory, replyFactory, retweetFactory } = require("./generator/factories");

function hasUser(name) {
  return fs.existsSync(`./src/services/twitter/intercepts/data/${name}`)
}

// message: JSON.stringify([{ code: 17, message: 'No user matches for specified terms.' }]),
function interceptTwitterApi() {
  log('using twitter api interceptor');

  const scope = nock('https://api.twitter.com', { allowUnmocked: false })
    .persist()
    // lookup correct user
    .get((uri) => {
      const q = url.parse(uri, true)
      const { screen_name } = q.query
      const matched = uri.includes('users/lookup') && hasUser(screen_name)
      if ( matched ) {
        log(`getting request for existing users, for uri=${uri}, screen_name=${screen_name}`)
      }
      return matched
    })
    .reply(200, function (uri) {
      const q = url.parse(uri, true);
      const { screen_name } = q.query
      const user = require(`./data/${screen_name}/user.json`)
      log(`sending response for uri=${uri}, screen_name=${screen_name}`, JSON.stringify(user))
      return [ user ]
    })
    // lookup incorrect user
    .get((uri) => {
      const q = url.parse(uri, true)
      const { screen_name } = q.query
      const matched = uri.includes('users/lookup') && !hasUser(screen_name)
      if ( matched ) {
        log(`getting request non-existing users, for uri=${uri}, screen_name=${screen_name}`)
      }
      return matched
    })
    .reply(404, function(uri) {
      const q = url.parse(uri, true)
      const { screen_name } = q.query
      log(`sending response for non-existing user, screen_name=${screen_name}`)
      return JSON.stringify({ "errors": [{ "code": 17, "message": "No user matches for specified terms." }] })
    })
    // user timeline
    .get((uri) => {
      const q = url.parse(uri, true)
      const { screen_name } = q.query
      const matched = uri.includes('statuses/user_timeline') && hasUser(screen_name)
      if ( matched ) {
        log(`getting request for uri=${uri}, screen_name=${screen_name}`)
      }
      return matched
    })
    .reply(200, function (uri) {
      const q = url.parse(uri, true);
      const { screen_name } = q.query
      const response = [
        require(`./data/${screen_name}/original.json`),
        require(`./data/${screen_name}/reply.json`),
        require(`./data/${screen_name}/retweet.json`),
      ]
      log(`sending response for uri=${uri}, screen_name=${screen_name}`, JSON.stringify(response.map(item => item.id)))
      return response
    })
    // destroy status
    .post((uri) => {
      const matched = uri.includes('statuses/destroy')
      if (matched) {
        log(`getting request for uri=${uri}`)
      }
      return matched
    })
    .reply(200, function (uri) {
      const q = url.parse(uri, true)
      const id = q.pathname.split("/").pop().replace(/\.json/, '')
      const user = userFactory()
      const original = originalFactory(user, { id })
      log(`sending response for statuses/destroy`, uri, JSON.stringify(original))
      return original;
    })
    // statuses show
    .get((uri) => {
      const matched = uri.includes('statuses/show') && uri.includes("id=")
      if ( matched ) {
        log(`getting request for uri=${uri}`);
      }
      return matched
    })
    .reply(function (uri) {

      const q = url.parse(uri, true);
      const id = q.query.id

      let user, file

      if ( id === "20" ) {
        user = "jack"
        file = "status.json"
      }
      else if ( id === "788099220381335552" ) {
        user = "reid"
        file = "status.json"
      }
      else {
        user = 'v_aminev'
        const tweets = require(`./data/${user}/tweets.json`)
        file = tweets[id]
      }

      if (!file) {
        log(`interception error: tweet id=${id} not found`)
        // actually twitter return 404 ,but tests expect 400, it is weird
        return [400, JSON.stringify({ "errors": [{ "code": 144, "message": "No status found with that ID." }] })]
      } else {
        const response = require(`./data/${user}/${file}`)
        log(`sending response to uri=${uri}, id=${id}, file=${file}, user=${user}, response=${JSON.stringify(response)}`)
        return [200, response];
      }
    })
    // update statuses
    .post((uri) => {
      const matched = uri.includes('statuses/update')
      if ( matched ) {
        log(`getting request for uri=${uri}`)
      }
      return matched
    })
    .reply(200, function (uri, body) {
      const response = require(`./data/v_aminev/reply.json`)
      log(`sending response for statuses/update, uri=${uri}, body=${body}, response=${response.id}`)
      return response;
    })
    // stream statuses/filter
    .post((uri) => {
      const matched = uri.includes('statuses/filter')
      if ( matched ) {
        const q = url.parse(uri, true);
        log(`getting request for POST uri=${uri}, ${JSON.stringify(q.query)}`);
      }
      return matched
    })
    .reply(200, function (uri, body) {
      log(`sending response for statuses/filter, uri=${uri}, body=${body}`)
      const stream = new Stream.Duplex()
      stream.on("close", () => {
        log(`should interception be over?`)
        // nock.restore()
      })
      return stream;
    })
}

module.exports = {
  interceptTwitterApi
}
