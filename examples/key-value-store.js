/*
 * key-value-store.js
 */

const KeyValueStore = require('..').KeyValueStore

;(async () => {

  const store = new KeyValueStore(__dirname + '/key-value-store.db')

  await store.ready

  await store.set(42, { value: 'some value' })
  await store.set(43, { value: 'other value' })

  const item = await store.get(42)

  const updateItem = await store.update(42, { content: 'other content' })

  const items = await store.list()

  await store.remove(43)

  const updatedItems = await store.list()

  console.log({
    item,
    updateItem,
    items,
    updatedItems,
  })
})()
