const Errors = require('common-errors');
const Promise = require('bluebird');

module.exports = exports = function allowed(request) {
  const { auth } = request;

  if (auth.credentials.isAdmin !== true) {
    return Promise.reject(new Errors.NotPermittedError('Not an admin'));
  }

  return Promise.resolve(request);
};
