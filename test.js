/* Test! */
const ledshim = require('./ledshim');
const { getLogger } = require('loglevel');
const log = require('./simple-logger').getLogger('test');



test().then(() => log.info('done!'), e => log.error(e));

async function test() {
  log.debug('starting...');

  const test = [
    { r: 100, g: 0, b: 0, n: [1, 2, 3] },
    { r: 0, g: 50, b: 0, n: [5, 6, 7] },
    { r: 0, g: 0, b: 35, n: [9, 10, 11] },
    { r: 80, g: 30, b: 0, n: [13, 14, 15] },
    { r: 0, g: 45, b: 25, n: [17, 18, 19] },
    { r: 60, g: 0, b: 25, n: [21, 22, 23] },
    { r: 60, g: 40, b: 20, n: [25, 26, 27] }
  ];

  const leds = await ledshim.init();
  //await leds.setPixels(test);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const pulse = [3, 8, 25, 120, 5];
  const interval = 75;
  let edge = -5;

  while (true) {
    const pattern = [
      { r: pulse[0], g: 0, b: 0, n: [edge + 0] },
      { r: pulse[1], g: 0, b: 0, n: [edge + 1] },
      { r: pulse[2], g: 0, b: 0, n: [edge + 2] },
      { r: pulse[3], g: 0, b: 0, n: [edge + 3] },
      { r: pulse[4], g: 0, b: 0, n: [edge + 4] }
    ];

    await leds.setPixels(pattern);
    await sleep(interval);
    edge++;

    if (edge > 30) {
      edge = -5;
    }
  }


}