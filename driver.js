/* Driver for IS31FL3731 */
const fs = require('fs');
const log = require('./simple-logger').getLogger('IS31FL3731');

module.exports = function (address, deviceId = 1) {
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

  function writeBlock(offset, data) {
    const buffer = Buffer.from(data);
    try {
      log.debug(`WRITE (${hex(address)}): ${hex(offset)} - ${JSON.stringify(data)}`);
      bus.writeI2cBlockSync(address, offset, data.length, buffer);
    }
    catch (e) {
      log.error(e);
    }
  };

  function hex(int, size = 2) {
    return `0x${int.toString(16).toUpperCase().padStart(size, '0')}`;
  }

  return {
    writeBlock
  };
};