'use strict';

// modules > 3rd party
const _ = require('lodash');

// modules > midwest
const factory = require('midwest/factories/rest-handlers');
const { one } = require('easy-postgres/result');

const resolveCache = require('./resolve-cache');

// TODO enable customizing columns easily
const columns = [
  'id',
  'name',
  'path',
  'content',
  'createdById',
  'createdAt',
  'modifiedById',
  'modifiedAt',
];

module.exports = _.memoize((config) => {
  // modules > project

  const handlers = factory({
    db: config.db,
    table: 'regions',
    columns,
    emitter: config.emitter,
  });

  function findHtmlByPath(path) {
    return handlers.find({ path }).then((regions) => {
      if (!regions || regions.length === 0) return undefined;

      const html = regions.reduce((out, value) => {
        out[value.name] = value.content;

        return out;
      }, {});

      return html;
    });
  }

  function replace(id, json) {
    return handlers.replace(id, json).then(one);
  }

  function update(id, json) {
    return handlers.update(id, json).then(one);
  }

  return Object.assign({}, handlers, {
    findHtmlByPath,
    replace,
    update,
  });
}, resolveCache);
