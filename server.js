const express = require('express');
const app = express();
const server = require('http').Server(app);

// Get status
app.get('/status', (req, res) => {
  res.send({ MOCHA: process.env.MOCHA || 'nothing' });
});

// Start the server
const port = process.env.PORT || 80;
server.listen(port, callback => {
  console.info(`Server running on port ${port}`);
});