const Votes = require('../models/votes.js');
const Voter = require('../models/voter.js');
const {
  NOT_FOUND,
  NOT_EMPTY,
  INTERNAL_SERVER_ERROR,
  NO_CONFLICT,
} = require('../constants.js');

// After a successful vote, change the status isAvailable to false so that the voter doesn't vote again
const updateVoterState = (voterId, data, res) => {
  // Find voter and update isAvailable to false as he/she has casted the vote
  Voter.findByIdAndUpdate(
    voterId,
    {
      $set: { isAvailable: false },
    },
    { new: true, useFindAndModify: false, runValidators: true }
  )
    .then(voter => {
      if (!voter) {
        return res.status(NOT_FOUND).send({
          message: 'Voter not found',
        });
      }

      res.send(data);

      return true;
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message: err.message,
      });
    });
};

// Create a new constituency to collect votes of their respective voters
const createConstituencyToVote = (req, res) => {
  const { constituencyId, partyId, voterId } = req.body;

  // Create a Constituency
  const vote = new Votes({
    constituency: constituencyId,
    votes: [
      {
        party: partyId,
        voters: [voterId],
        count: 1,
      },
    ],
  });

  // Save a Constituency in the database
  vote
    .save()
    .then(data => {
      // Find voter and update isAvailable to false as he/she has casted the vote
      return updateVoterState(voterId, data, res);
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          err.message || 'Some error occurred while submitting the vote.',
      });
    });

  return false;
};

/**
 * If a constituency exists and a voter votes for a party, add the party and increase the vote count if the party doesn't exist for that constituency
 */
const addNewPartyToConstituency = (req, res) => {
  const { constituencyId, partyId, voterId } = req.body;

  Votes.findOneAndUpdate(
    {
      constituency: constituencyId,
      'votes.party': { $ne: partyId },
    },
    { $push: { votes: { party: partyId, voters: [voterId], count: 1 } } },
    { new: true }
  )
    .populate('constituency party voters')
    .then(constituency => {
      if (!constituency) {
        return res.status(NOT_FOUND).send({
          message: 'Constituency not found while adding a vote for a party',
        });
      }

      return updateVoterState(voterId, constituency, res);
    })
    .catch(() => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          'Error retrieving constituency details when adding a vote for a party',
      });
    });
};

// Update vote count for a party in a given consistency when a voter votes
const updateVoteCount = (req, res, constituency) => {
  const { constituencyId, partyId, voterId } = req.body;
  const parties = constituency.votes.filter(
    vote => vote.party.toString() === partyId
  );

  if (!parties.length) {
    return addNewPartyToConstituency(req, res);
  }

  if (parties.length === 1) {
    if (parties[0].voters.indexOf(voterId) > -1) {
      return res.status(NO_CONFLICT).send({
        message: 'Voter has already voted.',
      });
    }

    // Update the existing vote count
    Votes.update(
      {
        constituency: constituencyId,
        'votes.party': partyId,
      },
      {
        $set: {
          'votes.$.voters': [...parties[0].voters, voterId],
          'votes.$.count': parties[0].count + 1,
        },
      },
      { new: true }
    )
      .then(newConstituency => {
        if (!newConstituency) {
          return res.status(NOT_FOUND).send({
            message: 'Constituency not found while adding a vote for a party',
          });
        }

        res.send(newConstituency);

        return false;
      })
      .catch(() => {
        return res.status(NO_CONFLICT).send({
          message: "Couldn't update the vote count.",
        });
      });
  } else {
    return res.status(NO_CONFLICT).send({
      message:
        'Constituency is receiving 2 parties with the same name. This is a critical issue. Please verify and fix it.',
    });
  }

  return true;
};

// Cast a vote to a party under a constituency
exports.castVote = (req, res) => {
  // Validate request
  if (!Object.keys(req.body).length) {
    return res.status(NOT_EMPTY).send({
      message: 'Party details can not be empty',
    });
  }

  Votes.findOne({ constituency: req.body.constituencyId })
    .then(constituency => {
      // If a vote has not been casted yet for a constituency, then create one
      if (!constituency) {
        return createConstituencyToVote(req, res);
      }

      return updateVoteCount(req, res, constituency);
    })
    .catch(err => {
      if (err.kind === 'ObjectId') {
        return createConstituencyToVote(req, res);
      }

      return res.status(INTERNAL_SERVER_ERROR).send({
        message: 'Error retrieving constituency details',
      });
    });

  return false;
};

// Retrieve and return all constituencys from the database.
exports.findAll = (req, res) => {
  Votes.find()
    .populate('constituency votes.voters votes.party')
    .then(constituency => {
      res.send(constituency);
    })
    .catch(err => {
      return res.status(INTERNAL_SERVER_ERROR).send({
        message:
          err.message ||
          'Some error occurred while retrieving all constituencys.',
      });
    });
};
