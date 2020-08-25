const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const moment = require('moment');
const { google } = require('googleapis');

const Voter = require('../models/voter.js');
const Party = require('../models/party.js');
const {
  NOT_FOUND,
  NOT_EMPTY,
  INTERNAL_SERVER_ERROR,
  DUPLICATE_KEY,
  NO_CONFLICT,
} = require('../constants.js');

// 5 minutes
const FIVE_MIN = 300000;
const OTP_DIGITS = 6;
// https://medium.com/@nickroach_50526/sending-emails-with-node-js-using-smtp-gmail-and-oauth2-316fe9c790a1
const clientID =
  '547335072207-bp116p2tb0gf8god0lt552n4l20h54jn.apps.googleusercontent.com';
const clientSecret = 'P1X_lm1l99hHPDreypnBlZcv';
const refreshToken = '1/Em25AOZri54iCcKyQBAkaExzbhY6JNDERtHfMldDc_A';
const myEmail = 'shettyrahul8june@gmail.com';
const { OAuth2 } = google.auth;

const oauth2Client = new OAuth2(
  clientID, // ClientID
  clientSecret, // Client Secret
  'https://developers.google.com/oauthplayground' // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

const accessToken = oauth2Client.getAccessToken();
const smtpTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: 'shettyrahul8june@gmail.com',
    clientId: clientID,
    clientSecret,
    refreshToken,
    accessToken,
  },
});

// Create and Save a new voter
exports.create = (req, res) => {
  // Validate request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Voter details can not be empty',
    });
  }

  const { firstName, lastName, email, constituency } = req.body;

  // Create a Voter
  const voter = new Voter({
    firstName,
    lastName,
    email,
    constituency,
    isAvailable: true,
    otp: '',
  });

  // Save a Voter in the database
  voter
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      if (err.code === DUPLICATE_KEY) {
        return res.status(NO_CONFLICT).send({
          message: 'Email has already been registered.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: err.message || 'Some error occurred while creating the Voter.',
      });
    });

  return false;
};

// Retrieve and return all voters from the database.
exports.findAll = (req, res) => {
  Voter.find()
    .populate('constituency')
    .select('-otp')
    .then(voters => {
      res.send(voters);
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          err.message || 'Some error occurred while retrieving all voters.',
      });
    });
};

// Find a single voter with a voterId
exports.findOne = (req, res) => {
  Voter.findById(req.params.voterId)
    .populate('constituency')
    .select('-otp')
    .then(voter => {
      if (!voter) {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }
      res.send(voter);

      return true;
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: 'Error retrieving voter details',
      });
    });

  return false;
};

// Update a voter identified by the voterId in the request
exports.update = (req, res) => {
  // Validate Request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Voter content can not be empty',
    });
  }

  // Find voter and update it with the request body
  Voter.findByIdAndUpdate(
    req.params.voterId,
    {
      $set: req.body,
    },
    { new: true, useFindAndModify: false, runValidators: true }
  )
    .then(voter => {
      if (!voter) {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }

      res.send(voter);

      return true;
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message: err.message,
      });
    });

  return false;
};

// Delete a voter with the specified voterId in the request
exports.delete = (req, res) => {
  Voter.findByIdAndRemove(req.params.voterId)
    .then(voter => {
      if (!voter) {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }

      res.send({ message: 'Voter deleted successfully!' });

      return false;
    })
    .catch(err => {
      if (err.kind === 'ObjectId' || err.name === 'NotFound') {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: `Could not delete voter with id ${req.params.voterId}`,
      });
    });
};

// Find email and send OTP
exports.sendOtp = (req, res) => {
  // Validate request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Voter details can not be empty',
    });
  }

  const { email } = req.body;
  const generatedOTP = otpGenerator.generate(OTP_DIGITS, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });

  // Find email and send OTP
  Voter.findOneAndUpdate({ email }, { otp: generatedOTP }, { new: true })
    .populate('constituency')
    .then(voter => {
      if (!voter) {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }

      if (!voter.isAvailable) {
        return res.status(NOT_FOUND).send({
          message: 'You have already voted.',
        });
      }

      // for testing purposes
      // res.send({
      //   message: 'Email has been sent successfully to the voter.',
      //   voter,
      // });

      const mailOptions = {
        from: myEmail,
        to: email,
        subject: 'OTP for voting',
        text: `'Hi ${voter.firstName} ${voter.lastName},\n\nYour OTP to vote is ${generatedOTP}`,
      };

      smtpTransport.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(INTERNAL_SERVER_ERROR).send({
            message: 'Error occurred while sending the email.',
          });
        }

        res.send({
          message: 'Email has been sent successfully to the voter.',
          voter,
          info,
        });

        return true;
      });

      return false;
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: 'Error retrieving voter details',
      });
    });

  return false;
};

// Find email, verify OTP and send Party details
exports.verifyOtp = (req, res) => {
  // Validate request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Voter details can not be empty',
    });
  }

  const { email, otp } = req.body;

  // Find email and send OTP
  Voter.findOne({ email })
    .then(voter => {
      if (!voter) {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }

      const currentTimeInMS = moment().valueOf();
      const otpSentTimeInMS = moment(voter.updatedAt).valueOf();
      const isOtpValid = currentTimeInMS - otpSentTimeInMS < FIVE_MIN;

      if (isOtpValid && otp.toString() === voter.otp) {
        // Send parties if OTP is verified
        Party.find()
          .then(parties => {
            res.send({
              message: 'OTP has been verified.',
              parties,
            });
          })
          .catch(err => {
            return res.status(INTERNAL_SERVER_ERROR).send({
              message:
                err.message ||
                'Some error occurred while retrieving all parties.',
            });
          });
      } else {
        if (!isOtpValid) {
          return res.status(NO_CONFLICT).send({
            message: 'Time within which OTP should be verified has passed.',
          });
        }

        return res.status(NO_CONFLICT).send({
          message: 'OTP is invalid.',
        });
      }

      return true;
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: 'Error retrieving voter details',
      });
    });

  return false;
};
