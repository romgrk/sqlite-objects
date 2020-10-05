/*
 * database.js
 */

const Database = require('..').Database

;(async () => {

  const db = new Database(__dirname + '/database.db' /* , optional: schema path */)

  await db.run(`CREATE TABLE IF NOT EXISTS items (
      id    interger primary key,
      value text     not null
  )`)

  await db.insert(
    `INSERT OR REPLACE INTO items VALUES (@id, @value)`,
    { id: 42, value: 'some value' }
  )

  await db.insertMany(
    `INSERT OR REPLACE INTO items VALUES (@id, @value)`, [
      { id: 43, value: 'fourty-three' },
      { id: 44, value: 'fourty-four' },
    ]
  )

  // Variable placeholders use the @name syntax
  const row = await db.findOne(`SELECT * FROM items WHERE id = @id`, { id: 42 })
  // row === { id: 42, value: 'some value' }

  const rows = await db.findAll(`SELECT * FROM items`)
  // rows === [{ id: 42, value: 'some value' }]

  console.log({ row, rows })
})()
