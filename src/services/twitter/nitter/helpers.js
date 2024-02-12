function throwErrorIfFound(data) {
  if (data.errors) {
    throw data.errors.map((error) => ({ code: error.code, message: error.message }));
  }
}

function setInReplyTo(legacy) {
  if (legacy.in_reply_to_status_id_str) {
    legacy.in_reply_to_status_id = parseInt(legacy.in_reply_to_status_id_str, 10);
  }
  if (legacy.in_reply_to_user_id_str) {
    legacy.in_reply_to_user_id = parseInt(legacy.in_reply_to_user_id_str, 10);
  }
}

function setRetweetedStatus(legacy) {
  const retweet = legacy.retweeted_status_result?.result?.legacy;
  if (retweet) {
    const retweetId = legacy.retweeted_status_result?.result?.rest_id;

    let user = legacy.retweeted_status_result?.result?.core?.user_results?.result?.legacy;
    if (user) {
      user.id_str = legacy.retweeted_status_result?.result?.core?.user_results?.result.rest_id;
      user.id = parseInt(user.id_str, 10);
    }

    if (!user) {
      user = legacy.retweeted_status_result?.result?.core?.user_result?.result?.legacy;
      if (user) {
        user.id_str = legacy.retweeted_status_result?.result?.core?.user_result?.result?.rest_id;
        user.id = parseInt(user.id_str, 10);
      }
    }

    if (user) {
      legacy.retweeted_status = {
        ...retweet,
        id: parseInt(retweetId, 10),
        id_str: retweetId,
        user,
      };
    }
  }
}

function getTweetFromGraphQL(data, id) {
  const list = data?.data?.threaded_conversation_with_injections_v2?.instructions ?? [];

  for (const instruction of list) {
    if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries) {
        const entryType = entry.content?.entryType;
        if (entryType === 'TimelineTimelineItem') {
          const itemType = entry.content?.itemContent?.itemType;
          if (itemType === 'TimelineTweet') {
            const typename = entry.content?.itemContent?.tweet_results?.result?.__typename;
            const restId = entry.content?.itemContent?.tweet_results?.result?.rest_id;
            if (restId === id) {
              if (typename === 'Tweet') {
                const legacy = entry.content?.itemContent?.tweet_results?.result?.legacy;
                if (legacy) {
                  setRetweetedStatus(legacy);
                  setInReplyTo(legacy);

                  const user = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result?.legacy;
                  user.id_str = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result.rest_id;
                  user.id = parseInt(user.id_str, 10);
                  user.verified = entry.content?.itemContent?.tweet_results?.result?.core?.user_results?.result?.is_blue_verified;

                  return {
                    ...legacy,
                    id: parseInt(restId, 10),
                    id_str: restId,
                    user,
                    text: legacy.full_text,
                  };
                }
              }
            }
          }
        }
      }
      break;
    }
  }

  return null;
}

function getTweetsFromGraphQL(data) {
  const list = data?.data?.user_result?.result?.timeline_response?.timeline?.instructions ?? [];

  const tweets = [];
  let cursorTop;
  let cursorBottom;

  for (const item of list) {
    if (item.__typename === 'TimelineAddEntries') {
      for (const entry of item.entries) {
        const typename = entry.content?.__typename;

        if (typename === 'TimelineTimelineItem') {
          const tweet = entry.content?.content?.tweetResult?.result;

          if (tweet?.__typename === 'Tweet') {
            const { rest_id: restId, legacy } = tweet;

            const user = tweet.core?.user_result?.result?.legacy;
            user.id_str = tweet.core?.user_result?.result.rest_id;
            user.id = parseInt(user.id_str, 10);

            setRetweetedStatus(legacy);
            setInReplyTo(legacy);

            const outletTweet = {
              ...legacy,
              id: parseInt(restId, 10),
              id_str: restId,
              text: legacy.full_text,
              user,
            };

            tweets.push(outletTweet);
          }
        } else if (typename === 'TimelineTimelineCursor') {
          const cursorType = entry.content?.cursorType;
          const value = entry.content?.value;

          if (cursorType === 'Top') {
            cursorTop = value;
          } else if (cursorType === 'Bottom') {
            cursorBottom = value;
          }
        }
      }
    }
  }

  return { tweets, cursorTop, cursorBottom };
}

module.exports = {
  throwErrorIfFound,
  setInReplyTo,
  setRetweetedStatus,
  getTweetsFromGraphQL,
  getTweetFromGraphQL,
};
