/*
 * key-value-store.js
 */


const { merge } = require('object-path-immutable')

const SqliteDatabase = require('./sqlite-database')


const CREATE_TABLE =
  `CREATE TABLE IF NOT EXISTS items (
      id    text  primary key,
      value text  not null
  )`


/**
 * Persistent key-value store.
 */
class KeyValueStore {
  constructor(path) {
    this.client = new SqliteDatabase(path)
    this.ready = this.client.run(CREATE_TABLE)
  }

  /**
   * Get a single item
   * @param {string} id - The unique ID of the item
   * @returns {Object}
   */
  get(id) {
    return this.client.findOne(
      'SELECT * FROM items WHERE id = @id',
      { id }
    )
    .then(r => JSON.parse(r.value))
  }

  /**
   * Set a single item
   * @param {string} id    - The unique ID of the item
   * @param {Object} value - The value of the item
   */
  set(id, value) {
    return this.client.insert(
      'INSERT OR REPLACE INTO items VALUES (@id, @value)',
      { id, value: JSON.stringify(value) }
    )
    .then(() => value)
  }

  /**
   * Updates the item value with the given object. Performs a deep merge.
   * @param {string} id    - The unique ID of the item
   * @param {Object} patch - The changes to make to the stored value
   */
  update(id, patch) {
    return this.get(id)
    .then(object => this.set(id, merge(object, null, patch)))
  }

  delete(id) {
    return this.client.run('DELETE FROM items WHERE id = @id', { id })
  }

  keys() {
    return this.client.findAll(
      'SELECT id FROM items'
    )
    .then(rs => rs.map(r => r.id))
  }

  values() {
    return this.client.findAll(
      'SELECT value FROM items'
    )
    .then(rs => rs.map(r => JSON.parse(r.value)))
  }

  entries() {
    return this.client.findAll(
      'SELECT * FROM items'
    )
    .then(rs => rs.map(r => [r.id, JSON.parse(r.value)]))
  }

  map(fn) {
    return this.client.findAll(
      'SELECT * FROM items'
    )
    .then(rs => Promise.all(rs.map(r =>
      this.set(r.id, fn(JSON.parse(r.value)))
    )))
  }
}

module.exports = KeyValueStore
