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
      log.info(`Opening i2c-${deviceId}...`);
      const i2cBus = require('i2c-bus');
      bus = await i2cBus.openPromisified(deviceId);
    }
    catch (e) {
      log.error('Unable to open i2c device!');
    }
  }
  else {
    log.warn('i2c device not available! Running in mock mode...');
    bus = {
      writeI2cBlock: () => Promise.resolve()
    };
  }

  // Soft reboot device
  await reset();

  // Default settings
  await setConfig(MODE_REGISTER, 0); // Picture mode
  await setConfig(AUDIOSYNC_REGISTER, 0); // Audio input

  async function setBank(bankId) {
    await writeBlock(BANK_ADDRESS, [bankId]);
  }

  async function setConfig(configAddress, configValue) {
    await setBank(CONFIG_BANK);
    await writeBlock(configAddress, [configValue]);
  }

  async function showFrame(frame) {
    log.debug(`Show frame ${frame}`);
    await setConfig(FRAME_REGISTER, frame);
  }

  async function writeBlock(offset, data) {
    try {
      _.chunk(data, 32).forEach(async (x, i) => {
        const cursor = (i * 32) + offset;
        const bytes = Buffer.from(x);
        //log.debug(`WRITE (${hex(address)}): ${hex(cursor)} - ${JSON.stringify(x)}`);
        await bus.writeI2cBlock(address, cursor, bytes.length, bytes);
      });
    }
    catch (e) {
      log.error(e);
    }
  };

  async function writeFrame(frame, offset, data) {
    log.debug(`Write ${data.length} bytes of data to frame ${frame}, offset ${hex(offset)}`);
    await setBank(frame);
    await writeBlock(offset, data);
  }

  async function reset() {
    await setConfig(SHUTDOWN_REGISTER, 0)
    await sleep(10);
    await setConfig(SHUTDOWN_REGISTER, 1);
  }

  function sleep(ms) {
    log.debug(`Sleep for ${ms}ms`);
    return new Promise(r => setTimeout(r, ms))
  }

  function hex(int, size = 2) {
    return `0x${int.toString(16).toUpperCase().padStart(size, '0')}`;
  }

  return {
    writeFrame,
    showFrame,
  };
}

module.exports = {
  init
};