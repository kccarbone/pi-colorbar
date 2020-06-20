const { over } = require("lodash");

const blockSize = 500;
const interval = 60;
const usageBri = 50;
const solarBri = 30;
const pulse = [3, 8, 20, 120, 5];
let overpower = false;
let flash = false;
let usage = 0;
let solar = 0;
let edge = -9;
let leds;

// Bar layout:
// 0000000000111111111122222222
// 0123456789012345678901234567
// ------------------|---------
//     <usage>      mid <solar>
//       18          1     9

async function runLoop() {
  const sequence = new Array(84);
  edge = nextStep();
  flash = !flash;

  for (let i = 0; i < 28; i++) {
    let pwm = [0, 0, 0];

    if (i < 18 && i >= (18 - usage)) {
      pwm[0] = pulseLight(edge, i);
      pwm[2] = colorFill(1, i);
    }
    else if (i === 18) {
      pwm = midpoint();
    }
    else if (i > 18 && i <= (solar + 18)) {
      pwm[0] = pulseLight(edge, i);
      pwm[1] = colorFill(2, i);
    }

    sequence[i * 3 + 0] = pwm[0];
    sequence[i * 3 + 1] = pwm[1];
    sequence[i * 3 + 2] = pwm[2];
  }

  await leds.setSequence(sequence);
  setTimeout(runLoop, interval);
}

function midpoint() {
  return [50, 40, 20];
}

function colorFill(type, i) {
  if (type === 1) {
    return (usage > 18 && i === 0 && flash)
      ? usageBri * 2 : usageBri;
  }
  else {
    return (solar > 9 && i === 27 && flash)
      ? solarBri * 2 : solarBri;
  }
}

function pulseLight(edge, i) {
  if (i > (edge - pulse.length) && i <= edge) {
    if (overpower) {
      return pulse[(pulse.length - 1) - (edge - i)];
    }
    else {
      return pulse[edge - i];
    }
  }
  return 0;
}

function nextStep() {
  if (overpower) {
    return (edge > 40) ? -9 : edge + 1;
  }
  else {
    return (edge < -9) ? 40 : edge - 1;
  }
}

function register(app, device) {
  app.post('/energy', updateValues);
  leds = device;
  runLoop();
}

function updateValues(req, res) {
  usage = Math.round(req.body.usage / blockSize);
  solar = Math.round(req.body.solar / blockSize);
  overpower = !!(solar > usage);
  res.send({ op: 'success' });
}

module.exports = {
  register
};