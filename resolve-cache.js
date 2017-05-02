'use strict';

const _ = require('lodash');

module.exports = () => {
  let previous;

  return (obj) => {
    if (previous && (!obj || _.isEqual(obj, previous))) {
      return previous;
    } else {
      previous = obj;

      return obj;
    }
  };
};
