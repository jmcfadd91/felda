// Synthesized one-shot sound effects.

import { audio } from './audio.js';
import { playNote, noteFreq } from './synth.js';

function ctx() { return audio.ac && !audio.muted ? audio.ac : null; }

function tone(type, freq, dur, vol, opts = {}) {
  const ac = ctx();
  if (!ac) return;
  playNote(ac, audio.sfxGain, type, freq, ac.currentTime, dur, vol, opts);
}

function seq(notes, type = 'pulse50', vol = 0.22, gap = 0.07) {
  const ac = ctx();
  if (!ac) return;
  notes.forEach((n, i) => {
    playNote(ac, audio.sfxGain, type, noteFreq(n), ac.currentTime + i * gap, gap * 0.95, vol, { decayTo: 0.5 });
  });
}

const SFX = {
  sword: () => tone('noise', 0, 0.09, 0.25, { rate: 3, rateEnd: 0.8, decayTo: 0.1 }),
  spin: () => { tone('noise', 0, 0.22, 0.3, { rate: 0.8, rateEnd: 3.2, decayTo: 0.2 }); tone('pulse25', 300, 0.22, 0.12, { slideTo: 900 }); },
  hit: () => tone('noise', 0, 0.08, 0.3, { rate: 0.9, decayTo: 0.1 }),
  clink: () => { tone('pulse50', 1800, 0.05, 0.18); tone('pulse50', 2400, 0.05, 0.1); },
  hurt: () => { tone('pulse50', 220, 0.18, 0.3, { slideTo: 90 }); tone('noise', 0, 0.12, 0.2, { rate: 0.8 }); },
  enemyDie: () => tone('noise', 0, 0.3, 0.3, { rate: 1.6, rateEnd: 0.2, decayTo: 0.05 }),
  heart: () => seq(['B5', 'E6'], 'pulse50', 0.2, 0.08),
  gem: () => seq(['E6', 'B6'], 'pulse25', 0.16, 0.05),
  key: () => seq(['G5', 'C6', 'E6'], 'pulse50', 0.18, 0.06),
  chest: () => seq(['G4', 'A4', 'B4', 'C5'], 'pulse50', 0.22, 0.1),
  fanfare: () => seq(['C5', 'E5', 'G5', 'C6'], 'pulse50', 0.25, 0.12),
  secret: () => seq(['G5', 'F#5', 'D#5', 'A4', 'G#4', 'E5', 'G#5', 'C6'], 'pulse25', 0.18, 0.07),
  text: () => tone('pulse25', 880, 0.03, 0.08),
  cursor: () => tone('pulse50', 660, 0.04, 0.12),
  select: () => seq(['A4', 'D5'], 'pulse50', 0.16, 0.05),
  denied: () => tone('pulse50', 160, 0.15, 0.2, { slideTo: 110 }),
  bombFuse: () => tone('noise', 0, 0.1, 0.1, { rate: 4 }),
  bombBoom: () => { tone('noise', 0, 0.5, 0.45, { rate: 0.5, rateEnd: 0.1, decayTo: 0.05 }); tone('tri', 70, 0.4, 0.3, { slideTo: 30 }); },
  arrow: () => tone('noise', 0, 0.12, 0.2, { rate: 2.5, rateEnd: 1.2, decayTo: 0.1 }),
  boomerang: () => tone('pulse25', 500, 0.08, 0.1, { slideTo: 700 }),
  hookshot: () => { tone('noise', 0, 0.18, 0.15, { rate: 3.5, rateEnd: 2.5 }); tone('pulse25', 200, 0.18, 0.1, { slideTo: 600 }); },
  fall: () => tone('pulse50', 800, 0.4, 0.18, { slideTo: 100 }),
  splash: () => tone('noise', 0, 0.25, 0.25, { rate: 1.4, rateEnd: 0.4, decayTo: 0.1 }),
  stairs: () => seq(['C4', 'G3'], 'tri', 0.25, 0.09),
  doorOpen: () => { tone('noise', 0, 0.2, 0.2, { rate: 0.6, rateEnd: 1.4 }); tone('tri', 100, 0.2, 0.2, { slideTo: 160 }); },
  switch: () => seq(['C5', 'G5'], 'pulse50', 0.18, 0.06),
  whistleNote: (i = 0) => tone('sine', [392, 440, 523, 587][i % 4], 0.3, 0.3, { vibrato: true, decayTo: 0.7 }),
  melodyOk: () => seq(['C6', 'E6', 'G6', 'C7'], 'sine', 0.2, 0.09),
  lowHp: () => tone('pulse50', 880, 0.08, 0.12),
  save: () => seq(['E5', 'G5', 'B5', 'E6'], 'pulse25', 0.16, 0.08),
  burn: () => tone('noise', 0, 0.3, 0.25, { rate: 1.8, rateEnd: 0.9, decayTo: 0.2 }),
  bossRoar: () => { tone('noise', 0, 0.6, 0.35, { rate: 0.4, rateEnd: 0.15, decayTo: 0.3 }); tone('tri', 90, 0.6, 0.3, { slideTo: 50, vibrato: true }); },
};

export function sfx(name, arg) {
  const fn = SFX[name];
  if (fn) fn(arg);
}
