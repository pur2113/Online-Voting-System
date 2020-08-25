const constituencies = require('../controllers/constituencies.js');

module.exports = app => {
  // Create a new contituenncy
  app.post('/constituency', constituencies.create);

  // Retrieve all contituenncies
  app.get('/constituencies', constituencies.findAll);

  // Retrieve a single contituenncy with constituencyId
  app.get('/constituency/:constituencyId', constituencies.findOne);

  // Update a contituenncy with constituencyId
  app.put('/constituency/:constituencyId', constituencies.update);

  // Delete a contituenncy with constituencyId
  app.delete('/constituency/:constituencyId', constituencies.delete);
};
