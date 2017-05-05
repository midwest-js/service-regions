'use strict';

const _ = require('lodash');

const previous = [];

module.exports = (obj) => {
  const result = obj ? previous.find((item) => _.isEqual(item, obj)) : _.last(previous);

  if (result) {
    return result;
  } else {
    if (obj) {
      previous.push(obj);
    }

    return obj;
  }
};
