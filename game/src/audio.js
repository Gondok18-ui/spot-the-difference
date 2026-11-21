// audio.js — tiny WebAudio synth: no audio files, every sound is an
// oscillator shape made on the spot (a chime for a find, a low buzz for a
// miss, a soft tick as the clock runs low, a jingle for a cleared level).

let ctx = null;

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', gain = 0.12) {
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sounds = {
  find() { tone(880, 0, 0.16, 'sine', 0.14); tone(1318, 0.07, 0.22, 'sine', 0.12); },
  wrong() { tone(160, 0, 0.18, 'square', 0.06); },
  hint() { tone(1174, 0, 0.14, 'triangle', 0.1); tone(1568, 0.09, 0.18, 'triangle', 0.09); },
  tick() { tone(1046, 0, 0.05, 'sine', 0.05); },
  levelClear() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.24, 'triangle', 0.11)); },
  gameOver() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.14, 0.3, 'triangle', 0.1)); },
  click() { tone(660, 0, 0.05, 'sine', 0.05); },
};
