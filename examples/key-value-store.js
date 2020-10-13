/*
 * key-value-store.js
 */

const KeyValueStore = require('..').KeyValueStore

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
