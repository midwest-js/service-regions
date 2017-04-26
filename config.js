'use strict';

const _ = require('lodash');
// const isEmail = require('validator/lib/isEmail');
const isURL = require('validator/lib/isURL');

const tests = {
  db: (value) => {
    const keys = ['end', 'query', 'connect', 'begin'];

    return keys.every((key) => _.has(value, key));
  },
};

const config = require('./config-base.js');
const errored = require('midwest/util/validate')(tests)(config);

if (errored.length) {
  throw new Error(`Configuration is invalid: ${errored.join(', ')}`);
}

if (!Object.isFrozen(config)) {
  throw new Error('Configuration is not frozen');
}

module.exports = config;
