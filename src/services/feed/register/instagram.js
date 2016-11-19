const Errors = require('common-errors');
const Promise = require('bluebird');

const validateAccount = (account) => {
  if (account.id === undefined) {
    throw new Errors.ValidationError('Instagram account id must be present');
  }

  if (account.username === undefined) {
    throw new Errors.ValidationError('Instagram account username must be present');
  }

  if (account.token === undefined) {
    throw new Errors.ValidationError('Instagram account token must be present');
  }
};

const registerFeedMapper = (storage, data, logger) => (account) => {
  const { internal, network } = data;
  const feed = {
    internal,
    network,
    network_id: account.id,
    meta: JSON.stringify(account),
  };

  return storage
    .registerFeed(feed)
    .return(account)
    .tap(({ id }) => logger.info(`Save instagram feed ${id}`));
};

const fetchHistoryMapper = instagram => (account) => {
  const { id, token } = account;

  return instagram
    .syncUserMediaHistory(id, token)
    .return(account);
};

const logResult = logger => ({ length }) => logger.info(`Registered ${length} accounts`);

function register(data) {
  const { storage, instagram, logger } = this;
  const accounts = data.filter.accounts;

  accounts.forEach(validateAccount);

  return Promise
    .map(accounts, registerFeedMapper(storage, data, logger))
    .map(fetchHistoryMapper(instagram))
    .tap(logResult(logger));
}

module.exports = register;
