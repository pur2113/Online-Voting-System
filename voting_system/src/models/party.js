// @flow
const mongoose = require('mongoose');

const { MIN, MAX } = require('../constants.js');

const { Schema, model } = mongoose;

const partySchema = new Schema({
  partyName: {
    type: String,
    minlength: [MIN, `Party name must be at least ${MIN} characters.`],
    maxlength: [MAX, `Party name must be less than ${MAX} characters.`],
    required: [true, 'Party name cannot be blank.'],
    trim: true,
    unique: true,
  },
});

module.exports = model('Parties', partySchema);
