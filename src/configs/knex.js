const path = require('path');

module.exports = {
  knex: {
    client: 'pg',
    debug: false,
    connection: {
      host: 'postgres',
      user: 'postgres',
      password: '',
    },
    pool: { min: 0, max: 10 },
    searchPath: ['public', 'social'],
    migrations: {
      tableName: 'migrations',
      directory: path.resolve(__dirname, '../migrations'),
    },
  },
};
