const express = require('express');
const app = express();
const server = require('http').Server(app);
const bodyParser = require('body-parser');
const ledshim = require('./ledshim');
const log = require('./simple-logger').getLogger('Server');
const port = process.env.PORT || 80;
const ledsReady = { r: 50, g: 0, b: 0, n: [27] };
const serverReady = { r: 0, g: 25, b: 0, n: [26] };
let leds;

app.use(bodyParser.json());

// Get status
app.get('/status', (req, res) => {
  res.send({ status: 'ready' });
});

// Update LED indicator
app.post('/leds', async (req, res) => {
  log.info('LED update request2: ', JSON.stringify(req.body));
  await leds.setPixels(req.body);
  res.send({ op: 'success' });
});

// Start the service
ledshim.init().then(device => {
  leds = device;
  leds.setPixels([ledsReady]).then(() => {
    server.listen(port, callback => {
      log.info(`Server running on port ${port}`);
      leds.setPixels([ledsReady, serverReady]);
    });
  });
});

// Termination event
process.on('SIGINT', function () {
  log.warn('Service shutting down!');

  if (leds) {
    leds.setPixels([]).then(() => setTimeout(process.exit, 100));
  }
  else {
    process.exit();
  }
});