'use strict';

const isAuthenticated = require('express-module-membership/passport/authorization-middleware').isAuthenticated;

const mw = require('./middleware');

module.exports = [
  [ '/api/regions/', 'get', [ isAuthenticated, mw.formatQuery, mw.paginate, mw.find ]],
  [ '/api/regions/', 'post', [ isAuthenticated, mw.create ]],
  [ '/api/regions/:id', 'get', [ isAuthenticated, mw.findById ]],
  [ '/api/regions/:id', 'put', [ isAuthenticated, mw.put ]],
  [ '/api/regions/:id', 'patch', [ isAuthenticated, mw.patch ]],
  [ '/api/regions/:id', 'delete', [ isAuthenticated, mw.remove ]],
];
