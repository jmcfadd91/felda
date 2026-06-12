// Audio core: lazily-created AudioContext (unlocked by first input), master
// gain, and a lookahead song scheduler that keeps timing sample-accurate.

import { playNote, noteFreq } from './synth.js';
import { SONGS } from './songs.js';

const LOOKAHEAD = 0.12;  // seconds scheduled ahead
const TICK_MS = 25;

class AudioSys {
  constructor() {
    this.ac = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.song = null;       // parsed song being played
    this.songName = null;
    this.events = [];       // flattened, sorted note events
    this.nextIdx = 0;
    this.songStart = 0;
    this.loopLen = 0;
    this.timer = null;
  }

  unlock() {
    if (this.ac) {
      if (this.ac.state === 'suspended') this.ac.resume();
      return;
    }
    this.ac = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ac.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ac.destination);
    this.musicGain = this.ac.createGain();
    this.musicGain.gain.value = 0.55;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ac.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
    this.timer = setInterval(() => this._schedule(), TICK_MS);
    if (this._pendingSong) this.playSong(this._pendingSong);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  playSong(name) {
    if (!this.ac) { this._pendingSong = name; return; }
    if (this.songName === name) return;
    this.songName = name;
    const def = SONGS[name];
    if (!def) { this.song = null; this.events = []; return; }
    this.song = parseSong(def);
    this.events = this.song.events;
    this.loopLen = this.song.length;
    this.nextIdx = 0;
    this.songStart = this.ac.currentTime + 0.08;
  }

  stopSong() {
    this.songName = null;
    this.song = null;
    this.events = [];
    this._pendingSong = null;
  }

  _schedule() {
    if (!this.ac || !this.song || this.muted) return;
    const until = this.ac.currentTime + LOOKAHEAD;
    let guard = 0;
    while (guard++ < 200) {
      if (this.nextIdx >= this.events.length) {
        if (!this.song.loop) { this.song = null; return; }
        this.nextIdx = 0;
        this.songStart += this.loopLen;
      }
      const ev = this.events[this.nextIdx];
      const t = this.songStart + ev.t;
      if (t > until) break;
      this.nextIdx++;
      if (t < this.ac.currentTime - 0.02) continue; // missed (tab hidden)
      playNote(this.ac, this.musicGain, ev.type, ev.freq, t, ev.dur, ev.vol, ev.opts);
    }
  }
}

// "C4:4 E4:2 .:2" -> events. Duration unit: 16th notes. '|' ignored.
function parseTrack(text, type, vol, secsPer16th, opts) {
  const events = [];
  let t = 0;
  for (const tok of text.split(/[\s|]+/)) {
    if (!tok) continue;
    const [note, durStr] = tok.split(':');
    const dur = (Number(durStr) || 1) * secsPer16th;
    if (note !== '.' && note !== '') {
      if (type === 'noise') {
        // noise track: 'x'=hat, 'X'=snare-ish, 'o'=kick-ish
        const map = { x: { rate: 2.2, dur: 0.04, vol: vol * 0.5 }, X: { rate: 1.1, dur: 0.09, vol }, o: { rate: 0.35, dur: 0.09, vol } };
        const m = map[note];
        if (m) events.push({ t, type, freq: 0, dur: m.dur, vol: m.vol, opts: { rate: m.rate, decayTo: 0.1 } });
      } else {
        events.push({ t, type, freq: noteFreq(note), dur: dur * 0.92, vol, opts });
      }
    }
    t += dur;
  }
  return { events, length: t };
}

function parseSong(def) {
  const secsPer16th = 60 / def.tempo / 4;
  let events = [];
  let length = 0;
  const channels = [
    ['pulse1', 'pulse50', def.vol?.pulse1 ?? 0.22, { decayTo: 0.6 }],
    ['pulse2', 'pulse25', def.vol?.pulse2 ?? 0.16, { decayTo: 0.6 }],
    ['tri', 'tri', def.vol?.tri ?? 0.3, {}],
    ['noise', 'noise', def.vol?.noise ?? 0.18, {}],
  ];
  for (const [key, type, vol, opts] of channels) {
    if (!def[key]) continue;
    const tr = parseTrack(def[key], type, vol, secsPer16th, opts);
    events = events.concat(tr.events);
    length = Math.max(length, tr.length);
  }
  events.sort((a, b) => a.t - b.t);
  return { events, length, loop: def.loop !== false };
}

export const audio = new AudioSys();
