const Party = require('../models/party.js');
const {
  NOT_FOUND,
  NOT_EMPTY,
  INTERNAL_SERVER_ERROR,
  DUPLICATE_KEY,
  NO_CONFLICT,
} = require('../constants.js');

// Create and Save a new party
exports.create = (req, res) => {
  // Validate request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Party details can not be empty',
    });
  }

  const { partyName } = req.body;

  // Create a Party
  const party = new Party({
    partyName,
  });

  // Save a Party in the database
  party
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      if (err.code === DUPLICATE_KEY) {
        return res.status(NO_CONFLICT).send({
          message: 'Party has already been added.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: err.message || 'Some error occurred while creating the Party.',
      });
    });

  return false;
};

// Retrieve and return all parties from the database.
exports.findAll = (req, res) => {
  Party.find()
    .then(parties => {
      res.send(parties);
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          err.message || 'Some error occurred while retrieving all parties.',
      });
    });
};

// Find a single party with a partyId
exports.findOne = (req, res) => {
  Party.findById(req.params.partyId)
    .then(party => {
      if (!party) {
        return res.status(NOT_FOUND).send({
          message: 'Party not found',
        });
      }
      res.send(party);

      return true;
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return res.status(NOT_FOUND).send({
          message: 'Party not found.',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: 'Error retrieving party details',
      });
    });

  return false;
};

// Update a party identified by the partyId in the request
exports.update = (req, res) => {
  // Validate Request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Party content can not be empty',
    });
  }

  // Find party and update it with the request body
  Party.findByIdAndUpdate(
    req.params.partyId,
    {
      $set: req.body,
    },
    { new: true, runValidators: true, useFindAndModify: false }
  )
    .then(party => {
      if (!party) {
        return res.status(NOT_FOUND).send({
          message: 'Party not found',
        });
      }

      res.send(party);

      return true;
    })
    .catch(err => {
      return res.status(NO_CONFLICT).send({
        message: err.message,
      });
    });

  return false;
};

// Delete a party with the specified partyId in the request
exports.delete = (req, res) => {
  Party.findByIdAndRemove(req.params.partyId)
    .then(party => {
      if (!party) {
        return res.status(NOT_FOUND).send({
          message: 'Party not found',
        });
      }

      res.send({ message: 'Party deleted successfully!' });

      return false;
    })
    .catch(err => {
      if (err.kind === 'ObjectId' || err.name === 'NotFound') {
        return res.status(NOT_FOUND).send({
          message: 'Party not found',
        });
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: `Could not delete party with id ${req.params.partyId}`,
      });
    });
};
