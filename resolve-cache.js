'use strict';

const _ = require('lodash');

const previous = [];

module.exports = (obj) => {
  let result;

  if (obj != null) {
    result = previous.find((item) => _.isEqual(item, obj));
  }

  if (result) {
    return result;
  } else {
    if (obj != null) {
      previous.push(obj);
    }

    return obj;
  }
};
