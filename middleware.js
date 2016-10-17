'use strict';

const _ = require('lodash');

function extractLang(region, lang) {
  return _.mapValues(region, (value) => value[lang]);
}

const Region = require('./model');

const mw = {
  formatQuery: require('midwest/middleware/format-query'),
  paginate: require('midwest/middleware/paginate'),
};

let cache = {};

function create(req, res, next) {
  Region.create(req.body, (err, region) => {
    if (err) return next(err);

    res.locals.region = region;

    res.status(201);
    next();
  });
}

function find(req, res, next) {
  const page = Math.max(0, req.query.page) || 0;
  const perPage = Math.max(0, req.query.limit) || res.locals.perPage;

  const query = Region.find(_.omit(req.query, 'limit', 'sort', 'page'),
    null,
    { sort: req.query.sort || 'path', lean: true });

  if (perPage) {
    query.limit(perPage).skip(perPage * page);
  }

  query.exec((err, regions) => {
    res.locals.regions = regions;
    next(err);
  });
}

function findById(req, res, next) {
  if (req.params.id === 'new') return next();

  Region.findOne({ _id: req.params.id }).lean().exec((err, region) => {
    if (err) return next(err);

    res.status(200).locals.region = region;

    next();
  });
}

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

function patch(req, res, next) {
  Region.findById(req.params.id, (err, region) => {
    delete req.body._id;
    delete req.body.__v;

    _.extend(region, req.body);

    cache = {};
    // if(cache[regions.path])
    //  delete cache[regions.path]

    return region.save((err) => {
      if (err) return next(err);

      return res.status(200).json(region);
    });
  });
}

function paths(req, res, next) {
  Region.find().lean().exec((err, regions) => {
    res.locals.paths = _.uniq(regions.map((regions) => regions.path)).sort();
    next();
  });
}


function put(req, res, next) {
  Region.findById(req.params.id, (err, regions) => {
    _.difference(_.keys(regions.toObject()), _.keys(req.body)).forEach((key) => {
      regions[key] = undefined;
    });

    _.extend(regions, _.omit(req.body, '_id', '__v'));

    cache = {};

    return regions.save((err) => {
      if (err) return next(err);

      return res.status(200).json(regions);
    });
  });
}

function remove(req, res, next) {
  Region.findByIdAndRemove(req.params.id, (err, region) => {
    if (err) return next(err);

    if (region) {
      res.status(204);
      res.locals.region = region;
    }

    return next();
  });
}

module.exports = {
  create,
  find,
  findById,
  findByPath,
  findByPage,
  formatQuery: mw.formatQuery(['page', 'sort', 'path', 'name'], {
    name: 'regex',
  }),
  paginate: mw.paginate(Region, 20),
  patch,
  paths,
  put,
  remove,
};
