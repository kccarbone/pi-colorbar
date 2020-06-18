/* LED SHIM functions */
const driver = require('./driver');
const _ = require('lodash');
const log = require('./simple-logger').getLogger('LEDSHIM');

// Initial frame data defines which LEDs are enabled
const INIT_FRAME = _.fill(new Array(180), 0);
INIT_FRAME[1] = 0b00000000;
INIT_FRAME[2] = 0b10111111;
INIT_FRAME[3] = 0b00111110;
INIT_FRAME[4] = 0b00111110;
INIT_FRAME[5] = 0b00111111;
INIT_FRAME[6] = 0b10111110;
INIT_FRAME[7] = 0b00000111;
INIT_FRAME[8] = 0b10000110;
INIT_FRAME[9] = 0b00110000;
INIT_FRAME[10] = 0b00110000;
INIT_FRAME[11] = 0b00111111;
INIT_FRAME[12] = 0b10111110;
INIT_FRAME[13] = 0b00111111;
INIT_FRAME[14] = 0b10111110;
INIT_FRAME[15] = 0b01111111;
INIT_FRAME[16] = 0b11111110;
INIT_FRAME[17] = 0b01111111;
INIT_FRAME[18] = 0b00000000;

// Start of PWM data in each frame
const PWM_OFFSET = 0x24;

// Sequential location of R/G/B values on LEDSHIM
const PIXEL_MAP = [
  118, 69, 85,
  117, 68, 101,
  116, 84, 100,
  115, 83, 99,
  114, 82, 98,
  113, 81, 97,
  112, 80, 96,
  134, 21, 37,
  133, 20, 36,
  132, 19, 35,
  131, 18, 34,
  130, 17, 50,
  129, 33, 49,
  128, 32, 48,
  127, 47, 63,
  121, 41, 57,
  122, 25, 58,
  123, 26, 42,
  124, 27, 43,
  125, 28, 44,
  126, 29, 45,
  15, 95, 111,
  8, 89, 105,
  9, 90, 106,
  10, 91, 107,
  11, 92, 108,
  12, 76, 109,
  13, 77, 93
];

const scratch1 = _.fill(new Array(84), 0);

const boring1 = [...scratch1];
boring1[30] = 100;
boring1[31] = 0;
boring1[32] = 0;

const scratch2 = _.fill(new Array(84), 0);

const boring2 = [...scratch2];
boring2[33] = 0;
boring2[34] = 0;
boring2[35] = 25;

async function init(address = 0x75, deviceId = 1) {
  log.debug(`Initializing LEDSHIM (0x${address.toString(16)})`);
  const device = await driver.init(address, deviceId);
  let currentFrame = 0;

  // Initialize all 8 frames
  _.range(8).forEach(x => initFrame(x));

  // Start on frame 0
  device.showFrame(0);

  log.info('LEDSHIM ready');

  function setPixels(pattern) {
    const stagingFrame = (currentFrame === 0) ? 1 : 0;
    show(stagingFrame, pattern);
  }

  setPixels(boring1);
  await new Promise(r => setTimeout(r, 1000));
  setPixels(boring2);
  await new Promise(r => setTimeout(r, 1000));
  setPixels(boring1);

  function show(frame, pattern) {
    log.info(`Show patten on frame ${frame}`);
    const arr = _.fill(new Array(144), 0);
    const bytes = pattern.reduce(mapPixels, arr);

    device.writeFrame(frame, PWM_OFFSET, bytes);
    device.showFrame(frame);
    currentFrame = frame;
  }

  function initFrame(frame) {
    device.writeFrame(frame, 0, INIT_FRAME);
  }

  function mapPixels(array, value, index) {
    array[PIXEL_MAP[index]] = value;
    return array;
  }

  function setPixel(n, r, g, b) {
    //device.writeBlock(1, [2]);
  };

  return {
    setPixel
  };
}

module.exports = {
  init
};

