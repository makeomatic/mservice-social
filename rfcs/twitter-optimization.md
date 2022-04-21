# Twitter Service optimizing

## Overview and motivation

Social twitter database is incredible increasing over time. 
We receive tweets for registered accounts, and in addition to this we collect replies, retweets and mentions from other twitter users. 

For some cases for popular accounts such as `fcbarcelona` or something else we can get (post to database) a huge amount of these tweets.

So all of the above negativelly affects the response time from sdk-requests.


## Goal

We need to improve performance of SQL queries for tweets.

As one option, to solve this problem, we can delete old and useless records from the twitter database.


## Current State

We use daily cron job with the schedule. It's allow to cleaning up the *all* database records excluding from white-list accounts and tweets inserted from studio.

```
DELETE FROM STATUSES 
WHERE account NOT in ( 'streamlayer','fcbarcelona'...) 
AND explicit IS NOT TRUE
```

It's just a temporary approach and it should be replaced with the more clear optimization.



## Approach 1: Limitation by account

Task says:
>We need to store the last 200 entries for the Twitter account and delete the others.


We use statuses/user_timeline for tweets fetching
https://developer.twitter.com/en/docs/twitter-api/v1/tweets/timelines/api-reference/get-statuses-user_timeline


Most of retweets and mentions are from users who has several tweets in database. This is just one-time references to registered account from thousands people.
The database will be populated with accounts of such "barcelona fans".
And reducing count of message per account will not make a difference.


**Resume**: This approach is not effective.

## Approach 2: Filter retweets & replies

We partically implemented this functionality in the social service.

In configs:
```
 twitter: {
    ...
    stream_filters: {
      replies: false,
      retweets: false,
      skipValidAccounts: false,
    },
 }
```


On tweet streaming we use the pagination `cursor` and use it for the next requests. 

During testing we are faced with some problems. When the filter is applied, the cursor may point to the skipped tweet and become invalid.

It results in recursive tweet fetching and the Social service hangs up.
For now, it disabled and filter is not active.

This current code should be improved to manage the `cursor` correctly.


## Approach 3: Source Account (Registered Feed)


**Idea:**

We can analyse the tweet content to extract source account from content.
And keep origin or mentioned account for all statuses from tweet stream.

Then perform data limitation based on the `source_account` column.
Thus, all tweets from other users related to source account will be counted.

Twitter API v1.0 Example payloads:
https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/example-payloads


**How to implements:**

Extends `statuses` table with the `source_account` column to keep the user (account) from mention or reply/retweet.

We can detect source accounts using the following related properties of tweet:

- `data.retweeted_status.user`
- `data.in_reply_to_user_id` 
- `data.in_reply_to_status_id`

Then store it and perform deletion tweets based on this column.


## Other Possible Optimizations

Consider to:

- Use limitation by dates (drop all older then D)

- Use limitation by count of tweets (drop less then < M)

- Delete on postgres (use TRIGGER with FUNCTION to perform delete)

- Analize query execution planes and turn database indexes 

- Use database sharding by feed accounts (including retweets/replies/mentions) and manage count of then by total (last 200 per acc)


