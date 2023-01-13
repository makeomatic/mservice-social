/**
 * Perform an "Upsert" using the "INSERT ... ON CONFLICT ... " syntax in PostgreSQL 9.5
 * @link http://www.postgresql.org/docs/9.5/static/sql-insert.html
 * @author https://github.com/plurch
 */
const addUpsert = (knex, log) => {
  /**
   * @param {string} tableName - The name of the database table
   * @param {string} conflictTarget - The column in the table which has a unique index constraint
   * @param {Object} itemData - a hash of properties to be inserted/updated into the row
   * @returns {Promise} - A Promise which resolves to the inserted/updated row
   */
  knex.upsertItem = function upsertItem(tableName, conflictTarget, itemData) {
    const targets = conflictTarget.split(', ');
    const exclusions = Object.keys(itemData)
      .filter((c) => targets.indexOf(c) === -1)
      .map((c) => knex.raw('?? = EXCLUDED.??', [c, c]).toString())
      .join(', ');

    const insertString = knex(tableName).insert(itemData).toString();
    const conflictString = knex
      .raw(` ON CONFLICT (${conflictTarget}) DO UPDATE SET ${exclusions} RETURNING *;`)
      .toString();
    const query = (insertString + conflictString).replace(/\?/g, '\\?');

    log.debug({ table: tableName, id: conflictTarget, data: itemData }, `UPSERT: ${query}`);
    const res = knex.raw(query)
      .then((result) => {
        log.debug({ result }, 'UPSERT_RES');
        return result.rows[0];
      })
      .catch((error) => {
        log.error({ error }, 'UPSERT_ERROR');
        throw error;
      });

    return res;
  };

  return knex;
};

module.exports = addUpsert;
