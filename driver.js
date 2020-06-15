/* Driver for IS31FL3731 */
const fs = require('fs');
const log = require('./simple-logger').getLogger('IS31FL3731 driver');


module.exports = function (address, device = 1) {
  let bus;

  if (fs.existsSync(`/dev/i2c-${device}`)) {
    try {
      log.debug(`Opening i2c-${device}...`);
      const i2cBus = require('i2c-bus');
      bus = i2cBus.openSync(device);
    }
    catch{
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
      console.log(`WRITE: ${address} - ${offset} - ${JSON.stringify(data)}`);
      bus.writeI2cBlockSync(address, offset, data.length, buffer);
    }
    catch (e) {
      console.log(e);
    }
  }

  return {
    currentFrame: 1,
    writeBlock
  };
};