const Constituency = require('../models/constituency.js');
const {
  NOT_FOUND,
  NOT_EMPTY,
  INTERNAL_SERVER_ERROR,
  DUPLICATE_KEY,
  NO_CONFLICT,
} = require('../constants.js');

// Create and Save a new constituency
exports.create = (req, res) => {
  // Validate request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Constituency details can not be empty',
    });
  }

  const { state } = req.body;

  // Create a Constituency
  const constituency = new Constituency({
    state,
  });

  // Save a Constituency in the database
  constituency
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      if (err.code === DUPLICATE_KEY) {
        return res.status(NO_CONFLICT).send({
          message: 'State has already been added.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          err.message || 'Some error occurred while creating the Constituency.',
      });
    });

  return false;
};

// Retrieve and return all constituencys from the database.
exports.findAll = (req, res) => {
  Constituency.find()
    .then(constituencys => {
      res.send(constituencys);
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          err.message ||
          'Some error occurred while retrieving all constituencys.',
      });
    });
};

// Find a single constituency with a constituencyId
exports.findOne = (req, res) => {
  Constituency.findById(req.params.constituencyId)
    .then(constituency => {
      if (!constituency) {
        return res.status(NOT_FOUND).send({
          message: 'Constituency not found',
        });
      }
      res.send(constituency);

      return true;
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return res.status(NOT_FOUND).send({
          message: 'Constituency not found.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: 'Error retrieving constituency details',
      });
    });

  return false;
};

// Update a constituency identified by the constituencyId in the request
exports.update = (req, res) => {
  // Validate Request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Constituency content can not be empty',
    });
  }

  // Find constituency and update it with the request body
  Constituency.findByIdAndUpdate(
    req.params.constituencyId,
    {
      $set: req.body,
    },
    { new: true, runValidators: true, useFindAndModify: false }
  )
    .then(constituency => {
      if (!constituency) {
        return res.status(NOT_FOUND).send({
          message: 'Constituency not found',
        });
      }

      res.send(constituency);

      return true;
    })
    .catch(err => {
      return res.status(NO_CONFLICT).send({
        message: err.message,
      });
    });

  return false;
};

// Delete a constituency with the specified constituencyId in the request
exports.delete = (req, res) => {
  Constituency.findByIdAndRemove(req.params.constituencyId)
    .then(constituency => {
      if (!constituency) {
        return res.status(NOT_FOUND).send({
          message: 'Constituency not found',
        });
      }

      res.send({ message: 'Constituency deleted successfully!' });

      return false;
    })
    .catch(err => {
      if (err.kind === 'ObjectId' || err.name === 'NotFound') {
        return res.status(NOT_FOUND).send({
          message: 'Constituency not found',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: `Could not delete constituency with id ${req.params.constituencyId}`,
      });
    });
};
