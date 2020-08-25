// @flow
const mongoose = require('mongoose');

const { MIN, MAX } = require('../constants.js');

const { Schema, model } = mongoose;

const constituencySchema = new Schema({
  state: {
    type: String,
    minlength: [MIN, `State name must be at least ${MIN} characters.`],
    maxlength: [MAX, `State name must be less than ${MAX} characters.`],
    required: [true, 'State name cannot be blank.'],
    trim: true,
    unique: true,
  },
});

module.exports = model('Constituencies', constituencySchema);
