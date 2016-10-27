'use strict';
const _ = require('lodash');

const rest = require('midwest/middleware/rest');
const formatQuery = require('midwest/middleware/format-query');
const paginate = require('midwest/middleware/paginate');

function extractLang(region, lang) {
  return _.mapValues(region, (value) => value[lang]);
}

const Region = require('./model');

let cache = {};

function findByPath(req, res, next) {
  const page = res.locals.page;
  const path = page && page.path || req.path;

  if (_.has(cache, path)) {
    res.locals.regions = cache[path];

    if (res.lang) {
      res.locals.regions = extractLang(res.locals.regions, res.lang);
    }

    return next();
  }

  // const paths = page ? _.compact(_.map(page.pages, 'path')) : []

  // paths.push(path)

  Region.find({ path }).lean().exec((err, regions) => {
    if (err) return next(err);

    res.status(200);

    cache[path] = res.locals.regions = regions.reduce((out, value) => {
      out[value.name] = value.content;

      return out;
    }, {});

    if (res.lang) {
      res.locals.regions = extractLang(res.locals.regions, res.lang);
    }

    next();
  });
}

function findByPage(nested) {
  function fnc(page, lang, nested, cb) {
    if (!page) {
      return cb();
    }

    const path = page.routePath;

    let regions;

    if (_.has(cache, path)) {
      regions = cache[path];

      if (lang) {
        regions = extractLang(regions, lang);
      }

      if (nested && page.pages) {
        page.pages = page.pages.map(_.clone);

        cb = _.after(page.pages.length, cb);

        page.pages.forEach((_page) => {
          fnc(_page, lang, nested, cb);
        });
      } else {
        cb(null, regions);
      }
    } else {
      Region.find({ path }).lean().exec((err, regions) => {
        cache[path] = page.regions = regions.reduce((result, value) => {
          result[value.name] = value.content;

          return result;
        }, {});

        if (lang) {
          regions = extractLang(page.regions, lang);
        }

        if (nested && page.pages) {
          page.pages = page.pages.map(_.clone);

          cb = _.after(page.pages.length, cb);

          page.pages.forEach((_page) => {
            fnc(_page, lang, nested, cb);
          });
        } else {
          cb(null, regions);
        }
      });
    }
  }

  return Object.defineProperty((req, res, next) => {
    res.locals.page = _.clone(res.locals.page);

    fnc(res.locals.page, res.lang, nested, (err, regions) => {
      if (err) return next(err);

      res.locals.regions = regions;

      next();
    });
  }, 'name', { value: 'findByPage' });
}

function paths(req, res, next) {
  Region.find().lean().exec((err, regions) => {
    res.locals.paths = _.uniq(regions.map((regions) => regions.path)).sort();
    next();
  });
}

const mw = rest(Region);

module.exports = Object.assign({}, mw, {
  findByPath,
  findByPage,
  formatQuery: formatQuery(['page', 'sort', 'path', 'name'], {
    name: 'regex',
  }),
  paginate: paginate(Region, 20),
  paths,
  replace(req, res, next) {
    mw.replace(req, res, (err) => {
      if (err) return next(err);

      cache = {};

      next();
    });
  },
  update(req, res, next) {
    mw.update(req, res, (err) => {
      if (err) return next(err);

      cache = {};

      next();
    });
  },
});
