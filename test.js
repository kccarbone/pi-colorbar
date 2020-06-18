/* Test! */
const ledshim = require('./ledshim');
const { getLogger } = require('loglevel');
const log = require('./simple-logger').getLogger('test');



test().then(() => log.info('done!'), e => log.error(e));

async function test() {
  log.debug('starting...');
  const leds = await ledshim.init();
  leds.setPixel(1, 2, 3, 4);
}