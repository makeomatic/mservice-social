const path = require('path');

module.exports = {
  knex: {
    client: 'pg',
    debug: false,
    connection: {
      host: 'pg',
      user: 'postgres',
      password: '',
    },
    searchPath: 'public,social',
    migrations: {
      tableName: 'migrations',
      directory: path.resolve(__dirname, '../migrations'),
    },
  },
};
