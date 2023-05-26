const fs = require("fs");
const { userFactory, originalFactory, replyFactory, retweetFactory } = require("./factories");

const screenName = "v_aminev"
const user = userFactory(screenName)
const retweet = retweetFactory(user)
const original = originalFactory(user)
const reply = replyFactory(user)

const tweets = {}
tweets[`${original.id}`] = "original.json"
tweets[`${retweet.id}`] = "retweet.json"
tweets[`${reply.id}`] = "reply.json"

console.log(user)
console.log(original)
console.log(reply)
console.log(retweet)
console.log(tweets)

fs.mkdirSync(__dirname + `/../data/${screenName}`);
fs.writeFileSync(__dirname + `/../data/${screenName}/user.json`, JSON.stringify(user, null, 2))
fs.writeFileSync(__dirname + `/../data/${screenName}/original.json`, JSON.stringify(original, null, 2))
fs.writeFileSync(__dirname + `/../data/${screenName}/reply.json`, JSON.stringify(reply, null, 2))
fs.writeFileSync(__dirname + `/../data/${screenName}/retweet.json`, JSON.stringify(retweet, null, 2))
fs.writeFileSync(__dirname + `/../data/${screenName}/tweets.json`, JSON.stringify(tweets, null, 2))

