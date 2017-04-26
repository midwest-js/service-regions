'use strict';

// modules > native
const p = require('path');

// modules > 3rd party
const _ = require('lodash');

// modules > midwest
const factory = require('midwest/factories/handlers');

// modules > project
const config = require('./config');

const columns = ['id', 'name', 'path', 'content', 'createdById', 'dateCreated', 'modifiedById', 'dateModified'];

const handlers = factory({
  db: config.db,
  table: 'regions',
  columns,
  emitter: config.emitter,
});

let cache = {};

function findHtmlByPath(path) {
  if (_.has(cache, path)) {
    return Promise.resolve(cache[path]);
  }

  return handlers.find({ path }).then((regions) => {
    if (!regions || regions.length === 0) return undefined;

    const html = cache[path] = regions.reduce((out, value) => {
      out[value.name] = value.html;

      return out;
    }, {});

    return html;
  });
}

function replace(id, json) {
  return handlers.replace(id, json).then((result) => {
    if (result.path in cache) {
      _.set(cache, `${result.path}.${result.name}`, result.html);
    }

    return result.rows[0];
  });
}

function update(id, json) {
  return handlers.update(id, json).then((result) => {
    if (result.path in cache) {
      _.set(cache, `${result.path}.${result.name}`, result.html);
    }

    return result.rows[0];
  });
}

module.exports = Object.assign({}, handlers, {
  findHtmlByPath,
  replace,
  update,
});
