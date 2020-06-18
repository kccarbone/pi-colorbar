/* Driver for IS31FL3731 */
const fs = require('fs');
const _ = require('lodash');
const log = require('./simple-logger').getLogger('IS31FL3731');

// Offsets
const CONFIG_BANK = 0x0b;
const BANK_ADDRESS = 0xfd;

// Function registers
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

async function init(address, deviceId = 1) {
  let bus;

  if (fs.existsSync(`/dev/i2c-${deviceId}`)) {
    try {
      log.debug(`Opening i2c-${deviceId}...`);
      const i2cBus = require('i2c-bus');
      bus = i2cBus.openSync(deviceId);
    }
    catch (e) {
      log.error('Unable to open i2c device!');
    }
  }
  else {
    log.warn('i2c device not available! Running in mock mode...');
    bus = {
      writeI2cBlockSync: () => { }
    };
  }

  // Soft reboot device
  await reset();

  // Default settings
  setConfig(MODE_REGISTER, 0); // Picture mode
  setConfig(AUDIOSYNC_REGISTER, 0); // Audio input

  function setBank(bankId) {
    writeBlock(BANK_ADDRESS, [bankId]);
  }

  function setConfig(configAddress, configValue) {
    setBank(CONFIG_BANK);
    writeBlock(configAddress, [configValue]);
  }

  function showFrame(frame) {
    setConfig(FRAME_REGISTER, frame);
  }

  function writeBlock(offset, data) {
    try {
      _.chunk(data, 32).forEach((x, i) => {
        const cursor = (i * 32) + offset;
        const bytes = Buffer.from(x);
        log.debug(`WRITE (${hex(address)}): ${hex(cursor)} - ${JSON.stringify(x)}`);
        bus.writeI2cBlockSync(address, cursor, bytes.length, bytes);
      });
    }
    catch (e) {
      log.error(e);
    }
  };

  function writeFrame(frame, offset, data) {
    setBank(frame);
    writeBlock(offset, data);
  }

  async function reset() {
    setConfig(SHUTDOWN_REGISTER, 0)
    await new Promise(r => setTimeout(r, 10));
    setConfig(SHUTDOWN_REGISTER, 1);
  }

  function hex(int, size = 2) {
    return `0x${int.toString(16).toUpperCase().padStart(size, '0')}`;
  }

  return {
    writeBlock,
    writeFrame,
    showFrame,
  };
}

module.exports = {
  init
};