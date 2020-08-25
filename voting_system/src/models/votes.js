// @flow
const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const votesSchema = new Schema({
  party: {
    type: Schema.Types.ObjectId,
    ref: 'Parties',
    required: true,
  },
  voters: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Voters',
      required: true,
    },
  ],
  count: {
    type: Number,
    required: true,
  },
});

const listVotesSchema = new Schema({
  constituency: {
    type: Schema.Types.ObjectId,
    ref: 'Constituencies',
    required: true,
  },
  votes: [votesSchema],
});

module.exports = model('Votes', listVotesSchema);
