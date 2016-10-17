'use strict';

const router = new (require('express')).Router();

const { isAdmin } = require('midwest-module-membership/passport/authorization-middleware');

const mw = require('./middleware');

router.route('/')
  .get(mw.formatQuery, mw.paginate, mw.find)
  .post(isAdmin, mw.create);

router.route('/:id')
  .get(isAdmin, mw.findById)
  .patch(isAdmin, mw.patch)
  .put(isAdmin, mw.put)
  .delete(isAdmin, mw.remove);

module.exports = router;
