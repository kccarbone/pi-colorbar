/* LED SHIM functions */
const driver = require('./driver');
const _ = require('lodash');
const log = require('./simple-logger').getLogger('LEDSHIM');

const MODE_REGISTER = 0x00;
const FRAME_REGISTER = 0x01;
const AUTOPLAY1_REGISTER = 0x02;
const AUTOPLAY2_REGISTER = 0x03;
const BLINK_REGISTER = 0x05;
const AUDIOSYNC_REGISTER = 0x06;
const BREATH1_REGISTER = 0x08;
const BREATH2_REGISTER = 0x09;
const SHUTDOWN_REGISTER = 0x0a;
const GAIN_REGISTER = 0x0b;
const ADC_REGISTER = 0x0c;
const CONFIG_BANK = 0x0b;
const BANK_ADDRESS = 0xfd;
const AUTOPLAY_MODE = 0x08;
const AUDIOPLAY_MODE = 0x18;
const ENABLE_OFFSET = 0x00;
const BLINK_OFFSET = 0x12;
const COLOR_OFFSET = 0x24;
const ENABLE_BITS = [
  0b00000000,
  0b10111111,
  0b00111110,
  0b00111110,
  0b00111111,
  0b10111110,
  0b00000111,
  0b10000110,
  0b00110000,
  0b00110000,
  0b00111111,
  0b10111110,
  0b00111111,
  0b10111110,
  0b01111111,
  0b11111110,
  0b01111111,
  0b00000000
];
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
boring1[30] = 150;
boring1[31] = 0;
boring1[32] = 0;

async function init(address = 0x75, deviceId = 1) {
  log.debug(`Initializing LEDSHIM (0x${address.toString(16)})`);
  const device = new driver(address, deviceId);

  // Soft reboot device
  await reset();

  // Enable the right bits for this device
  enableLEDs(0);
  enableLEDs(1);
  enableLEDs(2);
  enableLEDs(3); // TODO: "allframes" method
  enableLEDs(4);
  enableLEDs(5);
  enableLEDs(6);
  enableLEDs(7);

  // Default settings
  setConfig(MODE_REGISTER, 0); // Picture mode
  setConfig(AUDIOSYNC_REGISTER, 0); // Audio input

  showFrame(0);
  show(1, boring1);

  function show(frame, pattern) {
    const arr = _.fill(new Array(144), 0);
    const bytes = pattern.reduce(mapPixels, arr);

    setBank(frame);

    _.chunk(bytes, 32).map((x, i) => {
      const offset = i * 32;
      device.writeBlock(COLOR_OFFSET + offset, x);
    });

    showFrame(frame);
  }


  function setBank(bankId) {
    device.writeBlock(BANK_ADDRESS, [bankId]);
  }

  function setConfig(configAddress, configValue) {
    setBank(CONFIG_BANK);
    device.writeBlock(configAddress, [configValue]);
  }

  function enableLEDs(frame) {
    setBank(frame);
    device.writeBlock(0, ENABLE_BITS);
  }

  function showFrame(frame) {
    setConfig(FRAME_REGISTER, frame);
  }

  function mapPixels(array, value, index) {
    array[PIXEL_MAP[index]] = value;
    return array;
  }

  async function reset() {
    setConfig(SHUTDOWN_REGISTER, 0)
    await new Promise(r => setTimeout(r, 10));
    setConfig(SHUTDOWN_REGISTER, 1);
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

