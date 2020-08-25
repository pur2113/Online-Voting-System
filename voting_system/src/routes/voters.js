const voters = require('../controllers/voters.js');

module.exports = app => {
  // Create a new Voter
  app.post('/voter', voters.create);

  // Retrieve all Voters
  app.get('/voters', voters.findAll);

  // Retrieve a single Voter with voterId
  app.get('/voter/:voterId', voters.findOne);

  // Update a Voter with voterId
  app.put('/voter/:voterId', voters.update);

  // Delete a Voter with voterId
  app.delete('/voter/:voterId', voters.delete);

  // Send OTP to email
  app.post('/voter/send-otp', voters.sendOtp);

  // Verify OTP against email
  app.post('/voter/verify-otp', voters.verifyOtp);
};
