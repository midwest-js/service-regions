'use strict';

// modules > 3rd party
const _ = require('lodash');
const mongoose = require('mongoose');

const config = require('./config');

const schema = {
  name: String,
  path: String,
  content: String,
  draft: String,
  dateCreated: { type: Date, default: Date.now },
  dateModified: Date,
  datePublished: Date,
};

if (config.languages) {
  const content = schema.content;
  const draft = schema.draft;

  schema.content = {};
  schema.draft = {};

  _.forEach(config.languages, (value) => {
    schema.content[value.iso] = content;
    schema.draft[value.iso] = draft;
  });
}

const RegionSchema = new mongoose.Schema(schema);

// TODO perhaps this should be made parallel
RegionSchema.pre('save', function (next) {
  if (!this.isNew) {
    const modified = this.modifiedPaths().slice(0);

    const i = modified.indexOf('datePublished');

    if (i > -1) {
      modified.splice(i, 1);
    }

    if (modified.length > 0) {
      this.dateModified = new Date();
    }
  }

  next();
});

module.exports = mongoose.model('Region', RegionSchema);
