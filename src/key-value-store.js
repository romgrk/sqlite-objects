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


class KeyValueStore {
  constructor(path) {
    this.client = new SqliteDatabase(path)
    this.ready = this.client.run(CREATE_TABLE)
  }

  get(id) {
    return this.client.findOne(
      'SELECT * FROM items WHERE id = @id',
      { id }
    )
    .then(r => JSON.parse(r.value))
  }

  set(id, value) {
    return this.client.insert(
      'INSERT OR REPLACE INTO items VALUES (@id, @value)',
      { id, value: JSON.stringify(value) }
    )
    .then(() => value)
  }

  update(id, patch) {
    return this.get(id)
    .then(object => this.set(id, merge(object, null, patch)))
  }

  remove(id) {
    return this.client.run('DELETE FROM items WHERE id = @id', { id })
  }

  list() {
    return this.client.findAll(
      'SELECT * FROM items'
    )
    .then(rs => rs.map(r => JSON.parse(r.value)))
  }
}

module.exports = KeyValueStore
