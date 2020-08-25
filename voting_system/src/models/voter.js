// @flow
const mongoose = require('mongoose');
require('mongoose-type-email');

const { MIN, MAX } = require('../constants.js');

const { Schema, model } = mongoose;

const voterSchema = new Schema(
  {
    firstName: {
      type: String,
      minlength: [MIN, `First name must be at least ${MIN} characters.`],
      maxlength: [MAX, `First name must be less than ${MAX} characters.`],
      required: [true, 'First name cannot be blank.'],
      trim: true,
    },
    lastName: {
      type: String,
      minlength: [MIN, `Last name must be at least ${MIN} characters.`],
      maxlength: [MAX, `Last name must be less than ${MAX} characters.`],
      required: [true, 'Last name cannot be blank.'],
      trim: true,
    },
    email: {
      type: mongoose.SchemaTypes.Email,
      required: [true, 'Email ID cannot be blank.'],
      unique: true,
    },
    isAvailable: Boolean,
    otp: String,
    constituency: {
      type: Schema.Types.ObjectId,
      ref: 'Constituencies',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model('Voters', voterSchema);
