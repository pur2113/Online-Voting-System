const votes = require('../controllers/votes.js');

module.exports = app => {
  // Create a new party
  app.post('/cast-vote', votes.castVote);

  // Create a new party
  app.get('/votes', votes.findAll);
};
