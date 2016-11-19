const { NotSupportedError } = require('common-errors');
const { omit, clone, keys, filter, map, reduce, compact } = require('lodash');
const { all } = require('bluebird');

const services = require('./');

class Feed {
  constructor(mservice) {
    this.logger = mservice.log;
    this.config = mservice.config;
    this.db = mservice.knex;

    this.tables = {
      feeds: 'feeds',
      statuses: 'statuses',
    };

    return this.init()
      .then(networks => this.logger.info(`Feed service initialized, enabled networks: ${keys(networks).join(', ')}`))
      .then(() => this);
  }

  async init() {
    this.enabledNetworks = filter(this.config.networks, network => network.enabled);
    this.networks = map(
      this.enabledNetworks,
      async network => await new services[network.name](network, this)
    );

    return all(this.networks)
      .then((networks) => {
        this.networks = reduce(compact(networks), (accum, network) => {
          accum[network.name] = network;
          return accum;
        }, {});
        return this.networks;
      });
  }

  async register(data) {
    const network = this.getNetwork(data.network);
    if (network === null) {
      throw new NotSupportedError(`${data.network} is not currently supported or disabled`);
    }

    const accounts = data.filter.accounts;
    const original = omit(data, 'filter');
    // must return array of account objects: { id, username }
    const expandedAccounts = await network.expandAccounts(accounts);

    for (let i = 0; i < accounts.length; i += 1) {
      const feed = clone(original);
      const expandedAccount = {
        account_id: expandedAccounts[i].id,
        account: expandedAccounts[i].username,
        access_token: expandedAccounts[i].access_token,
      };

      feed.network_id = expandedAccount.account_id;
      feed.meta = JSON.stringify(expandedAccount);

      // wait till storage is registered
      await this.registerFeed(feed);

      // sync feed
      await network.syncAccount(expandedAccount);
    }

    // start listening
    await network.refresh();

    // log that we finished
    this.logger.info(`Registered ${expandedAccounts.length} accounts`);

    return expandedAccounts;
  }

  async list({ filter: { id, internal, network } }) {
    const query = this.db(this.tables.feeds);
    if (id) {
      query.where({ id });
    } else {
      if (internal) {
        query.where({ internal });
      }
      if (network) {
        query.where({ network });
      }
    }
    return query;
  }

  async statuses({ filter: { network, account, page, pageSize, cursor, order } }) {
    const offset = page * pageSize;

    const query = this.db(this.tables.statuses)
      .select(this.db.raw('meta->>\'account\' as account, *'))
      .where('network', network)
      .orderBy('id', order)
      .limit(pageSize)
      .offset(offset);

    if (account) {
      query.whereRaw('meta->>\'account\' = ?', [account]);
    }

    if (cursor) {
      return order === 'desc'
        ? query.where('id', '<', cursor)
        : query.where('id', '>', cursor);
    }

    return query;
  }

  async remove(data) {
    const { networks } = this;
    const feed = await this.list({ filter: data });
    if (feed.length === 0) {
      return;
    }

    const { meta: { account } } = feed[0];
    await this.removeFeed(data);

    if (!data.keep_data) {
      await this.removeStatuses({ account, network: data.network });
    }

    if (data.network && networks[data.network]) {
      await networks[data.network].refresh();
    }
  }

  /* Database functions */

  getByAccountId(accountId, network) {
    return this.db.select().from(this.tables.feeds)
      .where('network', network)
      .whereRaw('meta->>\'account_id\' = ?', [accountId])
      .then((feeds) => {
        if (feeds.length === 0) {
          return null;
        }
        return feeds[0];
      });
  }

  registerFeed(data) {
    return this.db.upsertItem(this.tables.feeds, 'internal, network, network_id', data);
  }

  removeFeed(data) {
    const query = this.db(this.tables.feeds);
    if (data.id) {
      query.where({ id: data.id });
    } else {
      query.where({ internal: data.internal, network: data.network });
    }
    return query.del();
  }

  insertStatus(data) {
    return this.db.upsertItem(this.tables.statuses, 'id', data);
  }

  removeStatuses(data) {
    return this.db(this.tables.statuses)
      .where('network', data.network)
      .whereRaw('meta->>\'account\' = ?', [data.account])
      .del();
  }

  getLatestStatusByAccountId(accountId, network) {
    return this.db.select().from(this.tables.statuses)
      .where('network', network)
      .whereRaw('meta->>\'account_id\' = ?', [accountId])
      .limit(1)
      .orderBy('date', 'desc')
      .then((statuses) => {
        if (statuses.length === 0) {
          return null;
        }
        return statuses[0];
      });
  }

  /* Utilities */

  getNetwork(network) {
    if (keys(this.networks).indexOf(network) >= 0) {
      return this.networks[network];
    }
    return null;
  }
}

Feed.FEED_TABLE = 'feeds';

module.exports = Feed;
