/* eslint-disable no-console */
const assert = require('assert');
const nitter = require('../../src/services/twitter/nitter/nitter');
// const Twitter = require('../../src/services/twitter/twitter');

process.env.NITTER_URL = 'http://localhost:8080';

describe('Nitter', function Nitter() {
  it('should fetch id by username', async () => {
    const { id } = await nitter.fetchUserId('elonmusk');
    console.log('elonmusk id=', id);
    assert(id);
  });

  it('should fetch tweets by username', async () => {
    // const account = 'elonmusk';
    const account = 'v_aminev';
    const order = 'asc'; // dummy, no effect
    const maxPages = 100;

    let cursor = null;
    let looped = true;
    let pages = 1;
    // let count = 0;
    // let sample;

    while (looped) {
      // eslint-disable-next-line no-await-in-loop
      const { tweets, cursorTop, cursorBottom } = await nitter.fetchTweets(cursor, account, order);

      assert(cursorTop);
      assert(cursorBottom);
      assert(tweets !== null);

      for (const tweet of tweets) {
        console.log(cursorBottom, tweet.id_str, tweet.created_at, tweet.user.id_str, tweet.retweeted_status?.user?.id_str);
        // sample = tweet;
      }

      looped = pages < maxPages && tweets.length > 0;
      cursor = cursorBottom;
      // count += tweets.length;
      if (looped) {
        pages += 1;
      }
    }

    // console.log('tweets found: ', count, 'pages: ', pages);
    // console.log(JSON.stringify(sample, null, 2));
  });

  it('should fetch tweet by id', async () => {
    const account = 'elonmusk';
    const cursor = null;
    const order = null;
    const { tweets } = await nitter.fetchTweets(cursor, account, order);
    const [tweetFromList] = tweets;
    const { id_str: id } = tweetFromList;

    const tweetById = await nitter.fetchById(id);
    // console.log('seek', id, 'result', tweetById);
    assert(tweetById.id_str === id);
    assert(tweetById.full_text === tweetFromList.full_text);
    assert(tweetById.text === tweetFromList.text);
  });
});
