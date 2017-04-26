'use strict';

const _ = require('lodash');

const factory = require('midwest/factories/rest');
const formatQuery = require('midwest/factories/format-query');
const paginate = require('midwest/factories/paginate');

const handlers = require('./handlers');

const mw = factory({
  plural: 'regions',
  handlers,
});

function create(req, res, next) {
  Object.assign(req.body, {
    createdById: req.user.id,
  });

  mw.create(req, res, next);
}

function findHtmlByPath(req, res, next) {
  const path = req.path;

  // const paths = page ? _.compact(_.map(page.pages, 'path')) : []

  // paths.push(path)

  handlers.findHtmlByPath(path, (err, html) => {
    if (err) return next(err);

    res.locals.regions = html;

    next();
  });
}

function paths(req, res, next) {
  handlers.find({}, (err, regions) => {
    res.locals.paths = _.uniq(regions.map((regions) => regions.path)).sort();
    next();
  });
}

function update(req, res, next) {
  Object.assign(req.body, {
    modifiedById: req.user.id,
    dateModified: new Date(),
  });

  mw.update(req, res, next);
}

module.exports = Object.assign({}, mw, {
  create,
  findHtmlByPath,
  formatQuery: formatQuery(['page', 'sort', 'path', 'name'], {
    name: 'regex',
  }),
  paginate: paginate(handlers.count, 20),
  paths,
  update,
});
