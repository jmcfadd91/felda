// Songs as compact text tracks. Note tokens are NAME:DURATION with duration
// in 16th notes; '.' rests; '|' is a readability bar marker. Noise track:
// o = kick, X = snare, x = hat.

export const SONGS = {
  title: {
    tempo: 100,
    pulse1: `E5:8 G5:4 A5:4 | B5:12 A5:2 G5:2 | A5:8 G5:4 E5:4 | D5:16 |
             E5:8 G5:4 A5:4 | B5:8 D6:8 | C6:8 B5:4 A5:4 | B5:16 |
             G5:8 E5:4 G5:4 | A5:12 G5:4 | E5:8 D5:4 E5:4 | E5:16`,
    pulse2: `C4:16 | G4:16 | F4:16 | G4:16 | C4:16 | G4:16 | A4:16 | G4:16 | E4:16 | F4:16 | C4:16 | C4:16`,
    tri: `C3:8 G3:8 | E3:8 G3:8 | F3:8 C3:8 | G3:8 B2:8 | C3:8 G3:8 | E3:8 B3:8 | A3:8 E3:8 | G3:8 D3:8 | C3:8 G3:8 | D3:8 F3:8 | C3:8 G2:8 | C3:16`,
  },

  overworld: {
    tempo: 144,
    pulse1: `C5:6 G4:2 E5:4 D5:2 C5:2 | D5:6 B4:2 G4:8 | E5:6 F5:2 G5:4 E5:2 C5:2 | D5:6 B4:2 C5:8 |
             G5:6 E5:2 F5:4 D5:4 | E5:6 C5:2 A4:8 | F5:4 G5:4 A5:4 B5:4 | C6:8 G5:4 E5:4`,
    pulse2: `E4:4 E4:4 G4:4 G4:4 | G4:4 G4:4 D4:4 D4:4 | G4:4 G4:4 C5:4 C5:4 | G4:4 G4:4 E4:4 E4:4 |
             C5:4 C5:4 B4:4 B4:4 | G4:4 G4:4 E4:4 E4:4 | A4:4 B4:4 C5:4 D5:4 | E5:8 D5:4 C5:4`,
    tri: `C3:4 G3:4 C3:4 G3:4 | G2:4 D3:4 G2:4 D3:4 | A2:4 E3:4 A2:4 E3:4 | F2:4 C3:4 G2:4 G2:4 |
          C3:4 G3:4 C3:4 G3:4 | A2:4 E3:4 A2:4 E3:4 | F2:4 F3:4 G2:4 G3:4 | C3:4 G3:4 C3:8`,
    noise: `o:4 x:2 x:2 X:4 x:4 | o:4 x:2 x:2 X:4 x:4 | o:4 x:2 x:2 X:4 x:4 | o:4 x:2 x:2 X:2 x:2 X:4 |
            o:4 x:2 x:2 X:4 x:4 | o:4 x:2 x:2 X:4 x:4 | o:4 x:2 x:2 X:4 x:4 | o:4 X:4 o:4 X:4`,
  },

  dusk: {
    tempo: 108,
    vol: { pulse1: 0.18, pulse2: 0.12, tri: 0.3 },
    pulse1: `C5:6 G4:2 Eb5:4 D5:2 C5:2 | D5:6 B4:2 G4:8 | Eb5:6 F5:2 G5:4 Eb5:2 C5:2 | D5:6 B4:2 C5:8 |
             Ab4:8 G4:4 Eb4:4 | F4:8 Eb4:4 C4:4 | D4:4 Eb4:4 F4:4 G4:4 | C5:16`,
    pulse2: `Eb4:8 G4:8 | G4:8 D4:8 | G4:8 C5:8 | G4:8 Eb4:8 | C4:8 Bb3:8 | Ab3:8 G3:8 | F4:8 G4:8 | Eb4:16`,
    tri: `C3:8 G2:8 | G2:8 D3:8 | Ab2:8 Eb3:8 | F2:8 G2:8 | Ab2:8 Eb3:8 | F2:8 C3:8 | F2:8 G2:8 | C3:16`,
  },

  town: {
    tempo: 112,
    pulse1: `G4:4 C5:2 D5:2 E5:4 G5:4 | E5:4 D5:2 C5:2 D5:8 | A4:4 D5:2 E5:2 F5:4 A5:4 | F5:4 E5:2 D5:2 E5:8 |
             G4:4 C5:2 D5:2 E5:4 G5:4 | A5:4 G5:2 E5:2 G5:8 | F5:4 E5:4 D5:4 B4:4 | C5:12 .:4`,
    pulse2: `E4:4 G4:4 G4:4 G4:4 | G4:4 G4:4 F4:4 F4:4 | F4:4 A4:4 A4:4 A4:4 | A4:4 A4:4 G4:4 G4:4 |
             E4:4 G4:4 G4:4 G4:4 | C5:4 C5:4 B4:4 B4:4 | A4:4 G4:4 F4:4 D4:4 | E4:8 G4:4 E4:4`,
    tri: `C3:4 E3:4 G3:4 E3:4 | G2:4 B2:4 D3:4 B2:4 | D3:4 F3:4 A3:4 F3:4 | A2:4 C3:4 E3:4 C3:4 |
          C3:4 E3:4 G3:4 E3:4 | A2:4 C3:4 E3:4 C3:4 | F2:4 A2:4 G2:4 B2:4 | C3:8 G2:4 C3:4`,
  },

  forest: {
    tempo: 120,
    vol: { pulse1: 0.2 },
    pulse1: `E4:4 G4:4 B4:4 G4:4 | A4:4 C5:4 E5:8 | D5:4 B4:4 G4:4 B4:4 | A4:12 .:4 |
             E4:4 G4:4 B4:4 G4:4 | C5:4 E5:4 G5:8 | F5:4 E5:4 D5:4 C5:4 | B4:12 .:4`,
    pulse2: `.:8 E4:2 .:2 E4:2 .:2 | .:8 A3:2 .:2 A3:2 .:2 | .:8 G4:2 .:2 G4:2 .:2 | .:8 F4:2 .:2 F4:2 .:2 |
             .:8 E4:2 .:2 E4:2 .:2 | .:8 C4:2 .:2 C4:2 .:2 | .:8 D4:2 .:2 D4:2 .:2 | .:8 B3:2 .:2 B3:2 .:2`,
    tri: `E2:8 B2:8 | A2:8 E3:8 | G2:8 D3:8 | A2:8 E3:8 | E2:8 B2:8 | A2:8 C3:8 | D3:8 A2:8 | B2:8 F#2:8`,
    noise: `x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4 | x:4 x:4 x:4 x:4`,
  },

  fire: {
    tempo: 132,
    pulse1: `C4:2 .:2 C4:2 Eb4:2 F4:4 C4:4 | Gb4:2 F4:2 Eb4:2 C4:2 Eb4:8 | C4:2 .:2 C4:2 Eb4:2 F4:4 Ab4:4 | G4:2 F4:2 Eb4:2 F4:2 C4:8 |
             C5:4 Bb4:4 Ab4:4 G4:4 | Ab4:2 G4:2 F4:2 Eb4:2 F4:8 | Eb4:4 F4:4 Gb4:4 G4:4 | Ab4:8 G4:8`,
    pulse2: `C3:4 .:4 C3:4 .:4 | C3:4 .:4 C3:4 .:4 | C3:4 .:4 C3:4 .:4 | C3:4 .:4 C3:4 .:4 |
             Ab3:4 .:4 F3:4 .:4 | Db3:4 .:4 Db3:4 .:4 | Eb3:4 .:4 Eb3:4 .:4 | Ab2:4 .:4 G2:4 .:4`,
    tri: `C2:2 C2:2 G2:2 C2:2 C2:2 C2:2 Bb2:2 C2:2 | C2:2 C2:2 G2:2 C2:2 C2:2 C2:2 Bb2:2 C2:2 | C2:2 C2:2 G2:2 C2:2 C2:2 C2:2 Bb2:2 C2:2 | C2:2 C2:2 G2:2 C2:2 C2:2 C2:2 Bb2:2 C2:2 |
          Ab2:4 Ab2:4 F2:4 F2:4 | Db2:4 Db2:4 Eb2:4 Eb2:4 | Eb2:4 Eb2:4 Eb2:4 Eb2:4 | Ab2:8 G2:8`,
    noise: `o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 |
            o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 X:2 X:2 X:2 X:2`,
  },

  water: {
    tempo: 92,
    vol: { pulse1: 0.18, pulse2: 0.14 },
    pulse1: `A4:6 C5:2 E5:8 | D5:6 C5:2 B4:8 | C5:6 E5:2 A5:8 | G5:6 E5:2 D5:8 |
             E5:6 C5:2 A4:8 | B4:6 D5:2 F5:8 | E5:4 D5:4 C5:4 B4:4 | A4:16`,
    pulse2: `E4:4 A4:4 E4:4 A4:4 | D4:4 G4:4 D4:4 G4:4 | E4:4 A4:4 E4:4 A4:4 | E4:4 G4:4 E4:4 G4:4 |
             C4:4 E4:4 C4:4 E4:4 | D4:4 F4:4 D4:4 F4:4 | C4:4 E4:4 D4:4 E4:4 | C4:4 E4:4 A3:8`,
    tri: `A2:16 | G2:16 | A2:16 | E2:16 | A2:16 | D2:16 | E2:16 | A2:16`,
  },

  castle: {
    tempo: 100,
    pulse1: `D4:4 D4:4 D5:8 | C5:4 Bb4:4 A4:8 | Bb4:4 A4:4 G4:8 | A4:8 D4:8 |
             D4:4 D4:4 D5:8 | Eb5:4 D5:4 C5:8 | Bb4:4 C5:4 D5:8 | C#5:8 A4:8`,
    pulse2: `D3:8 A3:8 | F3:8 A3:8 | G3:8 Bb3:8 | F3:8 D3:8 | D3:8 A3:8 | C4:8 Ab3:8 | G3:8 F3:8 | E3:8 A3:8`,
    tri: `D2:4 D2:4 A2:4 D2:4 | D2:4 D2:4 A2:4 D2:4 | G2:4 G2:4 D3:4 G2:4 | D2:4 D2:4 A2:4 A2:4 |
          D2:4 D2:4 A2:4 D2:4 | C2:4 C2:4 G2:4 C2:4 | G2:4 G2:4 Bb2:4 G2:4 | A2:8 A2:8`,
    noise: `o:8 X:8 | o:8 X:8 | o:8 X:8 | o:8 X:8 | o:8 X:8 | o:8 X:8 | o:8 X:8 | o:8 X:8`,
  },

  boss: {
    tempo: 160,
    pulse1: `A4:2 A4:2 C5:2 A4:2 E5:4 C5:4 | F5:2 E5:2 D5:2 C5:2 D5:8 | A4:2 A4:2 C5:2 A4:2 E5:4 G5:4 | F5:2 E5:2 D5:2 E5:2 A4:8 |
             A5:4 G5:4 F5:4 E5:4 | F5:2 E5:2 D5:2 C5:2 D5:8 | D5:4 E5:4 F5:4 G#4:4 | A4:8 E5:8`,
    pulse2: `A3:2 .:2 A3:2 .:2 A3:2 .:2 A3:2 .:2 | D4:2 .:2 D4:2 .:2 D4:2 .:2 D4:2 .:2 | A3:2 .:2 A3:2 .:2 A3:2 .:2 A3:2 .:2 | E4:2 .:2 E4:2 .:2 E4:2 .:2 E4:2 .:2 |
             F4:2 .:2 F4:2 .:2 E4:2 .:2 E4:2 .:2 | D4:2 .:2 D4:2 .:2 D4:2 .:2 D4:2 .:2 | D4:2 .:2 E4:2 .:2 F4:2 .:2 E4:2 .:2 | A3:2 .:2 A3:2 .:2 E4:2 .:2 E4:2 .:2`,
    tri: `A2:2 A2:2 E2:2 A2:2 A2:2 A2:2 G2:2 A2:2 | D2:2 D2:2 A2:2 D2:2 D2:2 D2:2 C2:2 D2:2 | A2:2 A2:2 E2:2 A2:2 A2:2 A2:2 G2:2 A2:2 | E2:2 E2:2 B2:2 E2:2 E2:2 E2:2 D2:2 E2:2 |
          F2:4 F2:4 E2:4 E2:4 | D2:4 D2:4 D2:4 D2:4 | D2:4 E2:4 F2:4 E2:4 | A2:4 A2:4 E2:4 E2:4`,
    noise: `o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 |
            o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 o:2 X:2 x:2 | o:2 X:2 o:2 X:2 X:2 X:2 X:2 X:2`,
  },

  finalboss: {
    tempo: 152,
    pulse1: `D5:2 .:2 D5:2 Eb5:2 D5:2 C5:2 Bb4:4 | C5:2 .:2 C5:2 D5:2 C5:2 Bb4:2 A4:4 | Bb4:2 .:2 Bb4:2 C5:2 Bb4:2 A4:2 G4:4 | A4:4 Bb4:4 C#5:8 |
             D5:4 F5:4 E5:2 D5:2 C#5:4 | D5:4 A5:4 G5:2 F5:2 E5:4 | F5:2 E5:2 D5:2 C#5:2 D5:2 E5:2 F5:2 G5:2 | A5:8 .:2 A4:2 C#5:2 E5:2`,
    pulse2: `D4:4 .:4 D4:4 .:4 | C4:4 .:4 C4:4 .:4 | Bb3:4 .:4 Bb3:4 .:4 | A3:4 A3:4 A3:4 A3:4 |
             D4:4 .:4 A3:4 .:4 | D4:4 .:4 A3:4 .:4 | D4:4 Bb3:4 G3:4 A3:4 | A3:8 E4:8`,
    tri: `D2:2 D2:2 A2:2 D2:2 D2:2 D2:2 C2:2 D2:2 | C2:2 C2:2 G2:2 C2:2 C2:2 C2:2 Bb1:2 C2:2 | Bb1:2 Bb1:2 F2:2 Bb1:2 Bb1:2 Bb1:2 A1:2 Bb1:2 | A1:2 A1:2 E2:2 A1:2 A1:2 A1:2 G1:2 A1:2 |
          D2:4 D2:4 D2:4 D2:4 | D2:4 D2:4 D2:4 D2:4 | D2:4 Bb1:4 G1:4 A1:4 | A1:8 A1:8`,
    noise: `o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 X:2 X:2 X:2 X:2 |
            o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:2 x:2 X:2 x:2 o:2 x:2 X:2 x:2 | o:4 X:4 o:4 X:4`,
  },

  ending: {
    tempo: 96,
    loop: false,
    pulse1: `C5:8 G5:8 | E5:8 C5:4 D5:4 | E5:4 F5:4 G5:4 A5:4 | G5:16 |
             F5:8 E5:8 | D5:8 C5:4 D5:4 | E5:4 D5:4 C5:4 B4:4 | C5:16 | .:16 | C6:16`,
    pulse2: `E4:8 C4:8 | G4:8 E4:8 | C4:8 D4:8 | E4:16 | A4:8 G4:8 | F4:8 E4:8 | G4:8 F4:8 | E4:16 | .:16 | E5:16`,
    tri: `C3:16 | C3:16 | F2:8 G2:8 | C3:16 | F2:16 | A2:16 | F2:8 G2:8 | C3:16 | .:16 | C3:16`,
  },

  gameover: {
    tempo: 80,
    loop: false,
    pulse1: `E4:8 Eb4:8 | D4:8 C#4:8 | C4:16 | .:16`,
    tri: `A2:8 Ab2:8 | G2:8 F#2:8 | F2:16 | .:16`,
  },

  fairy: { // shrine / sacred places
    tempo: 110,
    vol: { pulse1: 0.15, pulse2: 0.12 },
    pulse1: `E6:4 C6:4 G5:4 C6:4 | D6:4 B5:4 G5:4 B5:4 | C6:4 A5:4 F5:4 A5:4 | G5:4 E5:4 G5:4 B5:4`,
    pulse2: `C5:4 G4:4 E4:4 G4:4 | B4:4 G4:4 D4:4 G4:4 | A4:4 F4:4 C4:4 F4:4 | E4:4 C4:4 E4:4 G4:4`,
    tri: `C3:16 | G2:16 | F2:16 | C3:16`,
  },

  shop: {
    tempo: 126,
    pulse1: `G4:2 C5:2 E5:2 C5:2 G4:2 C5:2 E5:2 C5:2 | A4:2 C5:2 F5:2 C5:2 A4:2 C5:2 F5:2 C5:2 | G4:2 B4:2 F5:2 B4:2 G4:2 B4:2 F5:2 B4:2 | G4:2 C5:2 E5:2 C5:2 E5:4 C5:4`,
    tri: `C3:4 C3:4 C3:4 C3:4 | F2:4 F2:4 F2:4 F2:4 | G2:4 G2:4 G2:4 G2:4 | C3:4 G2:4 C3:8`,
  },
};

// The four whistle melodies as note sequences (also used by the melody UI).
// Each note maps to an arrow direction: up/left/right/down.
export const WHISTLE_NOTES = { up: 'D5', left: 'G4', right: 'A4', down: 'E4' };
