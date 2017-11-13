'use strict'

// modules > 3rd party
const _ = require('lodash')

// modules > midwest
const factory = require('midwest/factories/rest-handlers')
const { one } = require('easy-postgres/result')

const resolver = require('deep-equal-resolver')()

// TODO enable customizing columns easily
const baseColumns = [
  'id',
  'name',
  'path',
  'createdById',
  'createdAt',
  'modifiedById',
  'modifiedAt',
]

module.exports = _.memoize((state) => {
  const { config } = state

  let columns = baseColumns.slice(0, 3)

  if (config && config.languages) {
    columns = columns.concat(config.languages.map((language) => `content_${language}`))
  } else {
    columns.push('content')
  }

  columns = columns.concat(baseColumns.slice(3))

  const handlers = factory({
    db: state.db,
    table: 'regions',
    columns,
    emitter: state.emitter,
  })

  function findHtmlByPath (path) {
    return handlers.find({ path }).then((regions) => {
      if (!regions || regions.length === 0) return undefined

      const html = regions.reduce((out, value) => {
        out[value.name] = value.content

        return out
      }, {})

      return html
    })
  }

  function replace (id, json) {
    return handlers.replace(id, json).then(one)
  }

  function update (id, json) {
    return handlers.update(id, json).then(one)
  }

  return Object.assign({}, handlers, {
    findHtmlByPath,
    replace,
    update,
  })
}, resolver)
