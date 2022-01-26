const Promise = require('bluebird');
const assert = require('assert');
const sinon = require('sinon');
const { merge } = require('lodash');
const { EventEmitter } = require('events');


describe('twitter delete from stream', function testSuite() {
  this.retries(20);

  const Social = require('../../src');
  const STATUSES_TABLE = 'statuses';

  const payload = {
    accounts: [
      { account_id: '111' },
      { account_id: '222' },
      { account_id: '333' },
    ],
    register: {
      internal: 'test@test.ru',
      network: 'twitter',
      accounts: [
        { username: 'evgenypoyarkov' },
        { id: '2533316504', username: 'v_aminev' },
      ],
    },
    read: {
      filter: {
        account: 'v_aminev',
      },
    },
    mockDeleteData: {
      status: {
        id: 558603122315382784,
        id_str: '558603122315382784',
        user_id: 214194508,
        user_id_str: '214194508',
      },
    },
    tweetStub: {
      created_at: 'Thu Apr 06 15:24:15 +0000 2017',
      id_str: '100',
      text: '1) Today we\u2019re sharing our vision for the future of the Twitter API platform!\nhttps://t.co/XweGngmxlP',
      user: {
        id: 1,
        name: 'Twitter Dev',
        screen_name: 'TwitterDev',
        location: 'Internet',
        url: 'https://dev.twitter.com/',
        description: `Your official source for Twitter Platform news, updates & events.
        Need technical help? Visit https://twittercommunity.com/ \u2328\ufe0f #TapIntoTwitter`,
      },
      place: {
      },
      entities: {
        hashtags: [
        ],
        urls: [
          {
            url: 'https://t.co/XweGngmxlP',
            unwound: {
              url: 'https://cards.twitter.com/cards/18ce53wgo4h/3xo1c',
              title: 'Building the Future of the Twitter API Platform',
            },
          },
        ],
        user_mentions: [
        ],
      },
    },
  };


  let service;
  let twitterService; // the future instance of service.service('twitter')
  const ee = new EventEmitter();
  ee.destroy = () => (ee.removeAllListeners());
  let onDeleteSpy; // spy for 'delete' event handler
  let onDataSpy; // spy for 'data' event handler
  let delTwitStatusStub; // stub for markDeleted() method from src/services/storage/twitter-statuses.js

  let setFollowStub; // stub for this.setFollowing() in src/services/twitter.js
  let fillAccIdsStub; // stub for this.fillAccIds() in src/services/twitter.js
  let listenStub; // stub for this.listen in src/services/twitter.js

  let allStubs; // all the stubs storage to restore them at the end
  const tweetId = payload.tweetStub.id_str;

  function initSpiesNStubs() {
    onDataSpy = sinon.spy(twitterService, 'onData');
    onDeleteSpy = sinon.spy(twitterService, 'onDelete');
    delTwitStatusStub = sinon.stub(twitterService.storage.twitterStatuses(), 'markDeleted').returns(0);
    setFollowStub = sinon.stub(twitterService, 'setFollowing');
    fillAccIdsStub = sinon.stub(twitterService, 'fillAccountIds');

    // make sure that if the accounts is empty array,
    // pass the fake account ids array to make twitter listener subscribe on our fake service
    const twitterListenFn = twitterService.listen.bind(service.service('twitter'));
    listenStub = sinon.stub(twitterService, 'listen').callsFake(() => {
      twitterListenFn(payload.accounts);
    });
    allStubs = new Set([
      delTwitStatusStub,
      setFollowStub,
      fillAccIdsStub,
      listenStub,
    ]);
  }

  before('start service', async () => {
    service = new Social(global.SERVICES);
    twitterService = service.service('twitter');
    initSpiesNStubs();

    // connecting event emitter to the method that receives the stream
    const streamStub = sinon.stub(twitterService.client, 'stream');
    streamStub.withArgs('statuses/filter').returns(ee);
    allStubs.add(streamStub);

    await service.connect();
  });

  it('should emit the delete event, check it and verify all the calls', async () => {
    ee.emit('delete', { ...payload.mockDeleteData });
    await Promise.delay(1500);
    assert.equal(onDeleteSpy.calledOnce, true);
    assert.equal(onDeleteSpy.calledWithMatch(payload.mockDeleteData), true);
    assert.equal(onDeleteSpy.callCount, 1);

    assert.equal(delTwitStatusStub.calledOnce, true);
    assert.equal(delTwitStatusStub.calledWithMatch({ id: payload.mockDeleteData.status.id }), true);
    assert.equal(delTwitStatusStub.callCount, 1);

    delTwitStatusStub.restore();
  });

  it('should insert test tweet to database and check onData spy calls:', async () => {
    ee.emit('data', payload.tweetStub);
    await Promise.delay(1500);
    assert.equal(onDataSpy.calledOnce, true);
    assert.equal(onDataSpy.calledWithMatch(payload.tweetStub), true);
    assert.equal(onDataSpy.callCount, 1);
  });

  it('before deleting tweet: should extract tweet from database and check for is_deleted:false', async () => {
    const data = await twitterService.storage.twitterStatuses().byId(tweetId);
    assert.equal(data.id, tweetId);
    assert.equal(data.is_deleted, false);
  });

  it('should emit the delete event in database:', async () => {
    const data = merge(
      payload.mockDeleteData,
      { status: { id: tweetId, id_str: tweetId } }
    );
    ee.emit('delete', data);
    await Promise.delay(1500);
    const deleted = await twitterService
      .storage
      .twitterStatuses()
      .byId(tweetId);

    const deletedF = await service
      .knex(STATUSES_TABLE)
      .where({ id: tweetId });

    assert.equal(deleted, undefined);
    assert.equal(deletedF.length, 1);
    assert.equal(deletedF[0].id, tweetId);
  });
  after('delete inserted tweet from database: ', async () => {
    await service.knex(STATUSES_TABLE).where({ id: tweetId }).del();
    const deletedCustom = await service.knex(STATUSES_TABLE).where({ id: tweetId });
    assert.equal(deletedCustom.length, 0);
  });
  after('clear all stubs, restore original methods of service: ', async () => {
    for (const stub of allStubs) {
      stub.restore();
    }
  });

  after('shutdown service', () => service.close());
});
