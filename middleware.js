'use strict'

const _ = require('lodash')

const factory = require('midwest/factories/rest')
const formatQuery = require('midwest/factories/format-query')
const paginate = require('midwest/factories/paginate')
const resolver = require('deep-equal-resolver')()

module.exports = _.memoize((state) => {
  const handlers = require('./handlers')(state)

  const mw = factory({
    plural: 'regions',
    handlers,
  })

  async function create (req, res, next) {
    const user = await req.user

    Object.assign(req.body, {
      createdById: user && user.id,
    })

    mw.create(req, res, next)
  }

  function findHtmlByPath (req, res, next) {
    const path = req.path

    // const paths = page ? _.compact(_.map(page.pages, 'path')) : []

    // paths.push(path)

    return handlers.findHtmlByPath(path).then((html) => {
      res.locals.regions = html

      next()
    }).catch(next)
  }

  function paths (req, res, next) {
    return handlers.find({}).then((regions) => {
      res.locals.paths = _.uniq(regions.map((regions) => regions.path)).sort()
      next()
    }).catch(next)
  }

  async function update (req, res, next) {
    const user = await req.user

    Object.assign(req.body, {
      modifiedById: user && user.id,
      modifiedAt: new Date(),
    })

    mw.update(req, res, next)
  }

  return Object.assign({}, mw, {
    create,
    findHtmlByPath,
    formatQuery: formatQuery(['page', 'sort', 'path', 'name'], {
      name: 'regex',
    }),
    paginate: paginate(handlers.count, 20),
    paths,
    update,
  })
}, resolver)
