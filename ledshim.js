/* LED SHIM functions */
const driver = require('./driver');
const _ = require('lodash');
const log = require('./simple-logger').getLogger('LEDSHIM');

// Initial frame data defines which LEDs are enabled
const INIT_FRAME = _.fill(new Array(180), 0);
INIT_FRAME[0x0] = 0b00000000;
INIT_FRAME[0x1] = 0b10111111;
INIT_FRAME[0x2] = 0b00111110;
INIT_FRAME[0x3] = 0b00111110;
INIT_FRAME[0x4] = 0b00111111;
INIT_FRAME[0x5] = 0b10111110;
INIT_FRAME[0x6] = 0b00000111;
INIT_FRAME[0x7] = 0b10000110;
INIT_FRAME[0x8] = 0b00110000;
INIT_FRAME[0x9] = 0b00110000;
INIT_FRAME[0xA] = 0b00111111;
INIT_FRAME[0xB] = 0b10111110;
INIT_FRAME[0xC] = 0b00111111;
INIT_FRAME[0xD] = 0b10111110;
INIT_FRAME[0xE] = 0b01111111;
INIT_FRAME[0xF] = 0b11111110;
INIT_FRAME[0x10] = 0b01111111;

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

async function init(address = 0x75, deviceId = 1) {
  log.debug(`Initializing LEDSHIM (0x${address.toString(16)})`);
  const device = await driver.init(address, deviceId);
  let currentFrame = 0;

  // Initialize all 8 frames
  for (let i = 0; i < 8; i++) {
    await initFrame(i);
  }

  // Start on frame 0
  await device.showFrame(0);

  log.info('LEDSHIM ready');

  // Pattern format: [{ r: 255, g: 255, b: 255, n: [1,2,3,...] }, {...}]
  async function setPixels(pattern) {
    const stagingFrame = (currentFrame === 0) ? 1 : 0;
    const sequence = _.fill(new Array(84), 0);

    pattern.forEach(x => {
      x.n.forEach(y => {
        if (y >= 0 && y < 28) {
          sequence[y * 3 + 0] = x.r;
          sequence[y * 3 + 1] = x.g;
          sequence[y * 3 + 2] = x.b;
        }
      });
    });

    await show(stagingFrame, sequence);
  }

  async function setSequence(sequence) {
    const stagingFrame = (currentFrame === 0) ? 1 : 0;
    await show(stagingFrame, sequence);
  }

  async function show(frame, sequence) {
    const arr = _.fill(new Array(144), 0);
    const bytes = sequence.reduce(mapPixels, arr);

    await device.writeFrame(frame, PWM_OFFSET, bytes);
    await device.showFrame(frame);
    currentFrame = frame;
  }

  async function initFrame(frame) {
    await device.writeFrame(frame, 0, INIT_FRAME);
  }

  function mapPixels(array, value, index) {
    array[PIXEL_MAP[index]] = value;
    return array;
  }

  return {
    setPixels,
    setSequence
  };
}

module.exports = {
  init
};

