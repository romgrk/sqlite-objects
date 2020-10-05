/*
 * sqlite-database.js
 */
/* eslint-disable no-console */


const fs = require('fs')
const sqlite3 = require('sqlite3')


class SqliteDatabase {
  constructor(path, structurePath = null) {
    this.path = path
    this.structurePath = structurePath
    this.reload()
  }

  reload() {
    const exists = fs.existsSync(this.path)

    this.instance = new sqlite3.Database(this.path)

    if (this.structurePath && !exists) {
      this.ready = this.setup(structurePath)
    }
    else {
      this.ready = Promise.resolve()
    }
  }

  setup(structurePath) {

    // Split table creation statements & run them
    const statements = fs.readFileSync(structurePath).toString()
      .replace(/(\/\*(\n|[^\n])*?\*\/)|(--[^\n]*)/gm, '') // remove comments
      .split(';')

    const actions = []
    this.instance.serialize(() => {
      statements.forEach(s => {
        actions.push(
          this.run(s)
            .catch(err => err.code === 'SQLITE_MISUSE' ? // Empty statement
                Promise.resolve()
              : Promise.reject(err)))
      })
    })

    Promise.all(actions)
      .then(() => console.log(chalk.green.bold('Created SQL tables')))
      .catch(err => {
        console.error(chalk.red.bold(err.code + ': ' + err.message))
        console.error(err.stack)
        process.exit(1)
      })
  }

  run(query, params = {}) {
    return new Promise((resolve, reject) => {
      const interpolated = interpolate(query, params)
      this.instance.run(interpolated.query, interpolated.params, function(err) {
        if (err)
          reject(err)
        else
          resolve(this.changes)
      })
    })
  }

  insert(query, params = {}) {
    return new Promise((resolve, reject) => {
      const interpolated = interpolate(query, params)
      this.instance.run(interpolated.query, interpolated.params, function(err) {
        if (err)
          reject(err)
        else
          resolve(this.lastID)
      })
    })
  }

  insertMany(query, rows) {
    return new Promise((resolve, reject) => {
      const db = this.instance

      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        const stmt = db.prepare(query)
        for (let i = 0; i < rows.length; i++) {
          stmt.run(addAtSign(rows[i]))
        }
        stmt.finalize()

        db.run('COMMIT', (err) => {
          if (err)
            reject(err)
          else
            resolve()
        })
      })
    })
  }

  findOne(query, params = {}) {
    return new Promise((resolve, reject) => {
      const interpolated = interpolate(query, params)
      this.instance.get(interpolated.query, interpolated.params, function(err, row) {
        if (err)
          reject(err)
        else
          resolve(row)
      })
    })
  }

  findAll(query, params = {}) {
    return new Promise((resolve, reject) => {
      const interpolated = interpolate(query, params)
      this.instance.all(interpolated.query, interpolated.params, function(err, rows) {
        if (err)
          reject(err)
        else
          resolve(rows)
      })
    })
  }

  toMapping(obj) {
    return (
      Object.keys(obj)
        .filter(key => key !== 'id')
        .map(key => `${key} = @${key}`)
        .join(', ') || ''
    );
  }
}

module.exports = SqliteDatabase




// Helpers

function addAtSign(object) {
  if (Array.isArray(object))
    return object

  const result = {}
  for (let key in object) {
    result['@' + key] = object[key]
  }
  return result
}

/**
 * Turns 'SELECT * FROM users WHERE id = @id', { id: 42 }
 * into  'SELECT * FROM users WHERE id = $1',  [ 42 ]
 * for usage with postgres module.
 */
function interpolate(query, params) {
  if (params == undefined)
    return { query: query, params: [] }

  if (typeof params !== 'object')
    throw new TypeError(`Expected type object for argument 'params', got ${typeof params}`)

  let index = 1
  const variables = {}

  const newQuery = query.replace(/@(\w+)/g, (m, name) => {

    if (!(name in params))
      throw new Error(`Missing parameter "${name}" \nin "${query}" \nwith: ${JSON.stringify(params)}`)

    if (!Array.isArray(params[name])) {
      if (!(name in variables))
        variables[name] = { index: index++, value: params[name] }

      return '$' + variables[name].index
    }

    if (!(name in variables)) {
      for (let i = 0; i < params[name].length; i++) {
        variables[`${name}:${i}`] = { index: index++, value: params[name][i] }
      }
    }

    return '(' + Array(params[name].length).fill(0).map((_, i) => '$' + variables[`${name}:${i}`].index).join(', ') + ')'
  })

  const newParams = Object.values(variables)
    .sort((a, b) => a.index - b.index)
    .reduce((acc, v) => {
      acc['$' + v.index] = v.value
      return acc
    }, {})

  return { query: newQuery, params: newParams }
}
