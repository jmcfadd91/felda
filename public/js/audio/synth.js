// Chiptune voices on Web Audio: two pulse waves, a triangle bass, and a
// noise channel, with simple ADSR envelopes.

let noiseBuffer = null;

export function getNoiseBuffer(ac) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate / 2, ac.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

const pulseWaves = new Map();

function pulseWave(ac, duty) {
  let w = pulseWaves.get(duty);
  if (!w) {
    const n = 32;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      // Fourier series of a pulse wave with given duty cycle
      imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    }
    w = ac.createPeriodicWave(real, imag);
    pulseWaves.set(duty, w);
  }
  return w;
}

// Schedule one note. type: 'pulse25' | 'pulse50' | 'tri' | 'noise'
export function playNote(ac, dest, type, freq, when, dur, vol, opts = {}) {
  const gain = ac.createGain();
  gain.connect(dest);
  const a = opts.attack ?? 0.005;
  const r = opts.release ?? 0.04;
  const sustain = Math.max(when + dur - r, when + a + 0.001);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(vol, when + a);
  if (opts.decayTo !== undefined) {
    gain.gain.linearRampToValueAtTime(vol * opts.decayTo, sustain);
  } else {
    gain.gain.setValueAtTime(vol, sustain);
  }
  gain.gain.linearRampToValueAtTime(0, when + dur + 0.01);

  let src;
  if (type === 'noise') {
    src = ac.createBufferSource();
    src.buffer = getNoiseBuffer(ac);
    src.loop = true;
    src.playbackRate.value = opts.rate ?? 1;
    if (opts.rateEnd !== undefined) {
      src.playbackRate.setValueAtTime(opts.rate ?? 1, when);
      src.playbackRate.linearRampToValueAtTime(opts.rateEnd, when + dur);
    }
  } else {
    src = ac.createOscillator();
    if (type === 'tri') src.type = 'triangle';
    else if (type === 'sine') src.type = 'sine';
    else src.setPeriodicWave(pulseWave(ac, type === 'pulse25' ? 0.25 : 0.5));
    src.frequency.setValueAtTime(freq, when);
    if (opts.slideTo !== undefined) {
      src.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), when + dur);
    }
    if (opts.vibrato) {
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = freq * 0.01;
      lfo.connect(lfoGain).connect(src.frequency);
      lfo.start(when);
      lfo.stop(when + dur + 0.05);
    }
  }
  src.connect(gain);
  src.start(when);
  src.stop(when + dur + 0.05);
  return src;
}

// Note name -> frequency. "C4", "F#3", "Bb2"
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return 440;
  let n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const octave = Number(m[3]);
  const midi = (octave + 1) * 12 + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
