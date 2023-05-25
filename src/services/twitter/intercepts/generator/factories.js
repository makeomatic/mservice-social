

const createOriginal = require('./models/original')
const createStatus = require('./models/status')
const createReply = require('./models/reply')
const createRetweet = require('./models/retweet')
const createUser = require('./models/user')
const createMentions = require('./models/mentions')

function retweetFactory(user) {
  const otherUser = createUser("retweet_user")
  const tweet = createOriginal(otherUser, [])
  const mentions = createMentions()
  return createRetweet(user, mentions, tweet)
}

function replyFactory(user) {
  const otherUser = createUser("other_user")
  const tweet = createOriginal(otherUser, [])
  const mentions = createMentions()
  return createReply(user, mentions, tweet)
}

function originalFactory(user) {
  const mentions = createMentions()
  return createOriginal(user, mentions)
}

function statusFactory(user) {
  const mentions = createMentions()
  return createStatus(user, mentions)
}

function userFactory(screenName) {
  return createUser(screenName)
}

module.exports = {
  userFactory,
  retweetFactory,
  replyFactory,
  originalFactory,
  statusFactory
}
