const express = require('express');
const bodyParser = require('body-parser');
// Configuring the database
const mongoose = require('mongoose');
const dbConfig = require('./config/database.js');
const { NOT_FOUND, INTERNAL_SERVER_ERROR } = require('./constants.js');

const PORT = 3000;

// create express app
const app = express();

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose
  .connect(dbConfig.url, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.info('Successfully connected to the database');
  })
  .catch(err => {
    console.info('Could not connect to the database. Exiting now...', err);
    process.exit();
  });

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// define a simple route
app.get('/', (req, res) => {
  res.json({
    message:
      'Welcome to Voting System application. Organize and keep track of all the voters, votes, parties and constituencies.',
  });
});

// Require Voter routes
require('./routes/voters.js')(app);

// Require Constituency routes
require('./routes/constituencies.js')(app);

// Require party routes
require('./routes/parties.js')(app);

// Require party routes
require('./routes/votes.js')(app);

// 404
app.use(function(req, res) {
  const { protocol, url, hostname, method } = req;
  const completeUrl = `${protocol}://${hostname}${url}`;

  return res.status(NOT_FOUND).send({
    message: `Route ${completeUrl} not found. It was a ${method} request.`,
  });
});

// 500 - Any server error
app.use(function(err, req, res) {
  return res.status(INTERNAL_SERVER_ERROR).send({ error: err });
});

// listen for requests
app.listen(PORT, () => {
  console.info(`Server is listening on port ${PORT}`);
});
