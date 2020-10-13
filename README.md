
# sqlite-objects

This package contains **usable** SQLite wrappers.

What does it mean:
 - Promise-based
 - Sane placeholders: `db.findOne('SELECT * FROM items WHERE id = @id', { id: 1 })`
 - Setup with `new Database(dbPath)` and that's it

#### Objects
 - [Database](#database)
 - [Key-value Store](#key-value-store)

## Database

This is a wrapper around a SQLite database.

```javascript
const Database = require('sqlite-objects').Database

;(async () => {

  const db = new Database(
    __dirname + '/database.db'
    // , schemaPath /* optional */
  )

  // await db.ready /* if schemaPath is provided */

  await db.run(`CREATE TABLE IF NOT EXISTS items (
      id    integer  primary key,
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
```

## Key-value Store

```javascript
const KeyValueStore = require('sqlite-objects').KeyValueStore

;(async () => {

  const store = new KeyValueStore(__dirname + '/key-value-store.db')

  await store.ready

  await store.set(42, { value: 'some value' })
  await store.set(43, { value: 'other value' })
  await store.set(44, { value: 'final value' })

  const item = await store.get(42)

  const updateItem = await store.update(42, { content: 'other content' })

  const items = await store.values()

  await store.delete(43)

  const updatedItemsKeys = await store.keys()

  for (let [key, value] of await store.entries()) {
    console.log(key, value)
  }

  console.log({
    item,
    updateItem,
    items,
    updatedItemsKeys,
  })
})()
```
