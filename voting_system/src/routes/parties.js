const parties = require('../controllers/parties.js');

module.exports = app => {
  // Create a new party
  app.post('/party', parties.create);

  // Retrieve all parties
  app.get('/parties', parties.findAll);

  // Retrieve a single party with partyId
  app.get('/party/:partyId', parties.findOne);

  // Update a party with partyId
  app.put('/party/:partyId', parties.update);

  // Delete a party with partyId
  app.delete('/party/:partyId', parties.delete);
};
