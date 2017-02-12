'use strict';

// modules > native
const p = require('path');

// modules > 3rd party
const _ = require('lodash');

// modules > midwest
const factory = require('midwest/factories/handlers');

// modules > project
const db = require(p.join(PWD, 'server/db'));

const columns = ['id', 'name', 'path', 'content', 'createdById', 'dateCreated', 'modifiedById', 'dateModified'];

const handlers = factory({
  table: 'regions',
  columns: columns,
});

let cache = {};

function findHtmlByPath(path, cb) {
  if (_.has(cache, path)) {
    return cb(null, cache[path]);
  }

  handlers.find({ path }, (err, regions) => {
    if (err) return cb(err);

    if (!regions || regions.length === 0) return cb();

    const html = cache[path] = regions.reduce((out, value) => {
      out[value.name] = value.html;

      return out;
    }, {});

    cb(null, html);
  });
}

function replace(id, json, cb) {
  handlers.replace(id, json, (err, result) => {
    if (err) return cb(err);

    if (result.path in cache) {
      _.set(cache, `${result.path}.${result.name}`, result.html);
    }

    cb(null, result);
  });
}

function update(id, json, cb) {
  handlers.update(id, json, (err, result) => {
    if (err) return cb(err);

    if (result.path in cache) {
      _.set(cache, `${result.path}.${result.name}`, result.html);
    }

    cb(null, result);
  });
}

module.exports = Object.assign({}, handlers, {
  findHtmlByPath,
  replace,
  update,
});
