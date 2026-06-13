// Dungeon 1: The Verdant Hollow. Overgrowth, dark rooms lit by Galewing
// flame relay. Item: Galewing. Boss: Bramblemaw.

import { dungeonRooms } from './dungeonkit.js';

const room = dungeonRooms({
  prefix: 'd1',
  theme: 'dungeon_green',
  music: 'forest',
  dungeon: 'd1',
});

// r1: entrance hall
room(1, {
  name: 'VERDANT HOLLOW',
  exit: { map: 'verdant_approach', x: 10, y: 4 },
  grid: [
    '####################',
    '#......g....g......#',
    '#..b............b..#',
    '#..................#',
    '#....,........,....#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#....g........g....#',
    '#..b............b..#',
    '#..................#',
    '#.........,........#',
    '####################',
  ],
  doors: { n: 'r2' },
  entities: [
    { type: 'sign', x: 5, y: 11, text: 'The Hollow remembers sunlight. It is not bitter about it. Mostly.' },
    { type: 'gloomwisp', x: 4, y: 3 },
    { type: 'gloomwisp', x: 15, y: 9 },
  ],
});

// r2: overgrown hub - key hidden among the bushes
room(2, {
  grid: [
    '####################',
    '#..bbb........bbb..#',
    '#..bbb...gg...bbb..#',
    '#...............b..#',
    '#..g..bbbb..g......#',
    '#.....bbbb.........#',
    '#.....bbbb....bb...#',
    '#..............b...#',
    '#..bb..g...........#',
    '#..b.......bbb..g..#',
    '#..........bbb.....#',
    '#....g.....bbb.....#',
    '####################',
  ],
  doors: {
    s: 'r1',
    n: { to: 'r5', kind: 'locked', id: 'd1_lock1' },
    w: 'r4',
    e: 'r3',
  },
  entities: [
    { type: 'chest', id: 'd1_key1', x: 7, y: 5, contents: 'key' },
    { type: 'thornling', x: 14, y: 4 },
    { type: 'thornling', x: 5, y: 10 },
  ],
});

// r4: push-block puzzle guards the Galewing
room(4, {
  grid: [
    '####################',
    '#..................#',
    '#.....########.....#',
    '#.....#......#.....#',
    '#.....#......#.....#',
    '#.....#......#.....#',
    '#.....#............#',
    '#.....#......#.....#',
    '#.....########.....#',
    '#..................#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: { e: 'r2' },
  entities: [
    { type: 'block', x: 11, y: 4 },
    { type: 'floorswitch', x: 11, y: 6, channel: 'blk' },
    { type: 'gate', x: 14, y: 6, channel: 'blk' },
    { type: 'chest', id: 'd1_item', x: 9, y: 4, contents: 'item:galewing' },
    { type: 'sign', x: 3, y: 9, text: 'Old root-script: WHAT WEIGHS UPON THE EARTH, OPENS IT.' },
    { type: 'pricklepod', x: 4, y: 4 },
  ],
});

// r3: dark room - relay flame from the lit brazier to three cold ones
room(3, {
  dark: true,
  grid: [
    '####################',
    '#..................#',
    '#..................#',
    '#....f........f....#',
    '#..................#',
    '#..................#',
    '#.........#........#',
    '#..................#',
    '#..................#',
    '#....f........f....#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: { w: 'r2' },
  entities: [
    { type: 'torch', x: 5, y: 4, lit: true },
    { type: 'torch', x: 14, y: 4, channel: 'fire3' },
    { type: 'torch', x: 5, y: 10, channel: 'fire3' },
    { type: 'torch', x: 14, y: 10, channel: 'fire3' },
    { type: 'gate', x: 16, y: 6, channel: 'fire3' },
    { type: 'chest', id: 'd1_bosskey', x: 18, y: 6, contents: 'bosskey' },
    { type: 'sign', x: 2, y: 11, text: 'CARRY THE FLAME ON WINGS. The wind remembers fire fondly.' },
    { type: 'gloomwisp', x: 10, y: 3 },
    { type: 'gloomwisp', x: 8, y: 9 },
  ],
});

// r5: pricklepod den, compass
room(5, {
  grid: [
    '####################',
    '#..................#',
    '#...g..........g...#',
    '#......#....#......#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#......#....#......#',
    '#...g..........g...#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: { to: 'r2', kind: 'locked', id: 'd1_lock1' },
    n: { to: 'r7', kind: 'locked', id: 'd1_lock2' },
    w: 'r6',
  },
  entities: [
    { type: 'pricklepod', x: 6, y: 5 },
    { type: 'pricklepod', x: 13, y: 7 },
    { type: 'chest', id: 'd1_compass', x: 16, y: 2, contents: 'compass' },
    { type: 'pot', x: 2, y: 10 },
    { type: 'pot', x: 17, y: 10 },
  ],
});

// r6: the crystal beyond the fence - only the Galewing can reach it
room(6, {
  grid: [
    '####################',
    '#..................#',
    '#.b....bbb.....b...#',
    '#..................#',
    '#....ffffffffff....#',
    '#....f........f....#',
    '#....f........f....#',
    '#....f........f....#',
    '#....ffffffffff....#',
    '#..................#',
    '#...b.......bb.....#',
    '#..................#',
    '####################',
  ],
  doors: { e: 'r5' },
  entities: [
    { type: 'crystal', x: 9, y: 6, channel: 'cr6' },
    { type: 'gate', x: 3, y: 6, channel: 'cr6' },
    { type: 'chest', id: 'd1_key2', x: 1, y: 6, contents: 'key' },
    { type: 'sign', x: 16, y: 9, text: 'The crystal sits smug behind its fence. Something thrown might wipe that gleam off.' },
    { type: 'gloomwisp', x: 10, y: 10 },
  ],
});

// r7: antechamber - last rest before the master of the Hollow
room(7, {
  grid: [
    '####################',
    '#..................#',
    '#......,....,......#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#....g........g....#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: { to: 'r5', kind: 'locked', id: 'd1_lock2' },
    n: { to: 'r8', kind: 'boss', id: 'd1_bossdoor' },
  },
  entities: [
    { type: 'savestatue', x: 6, y: 6 },
    { type: 'chest', id: 'd1_map', x: 13, y: 6, contents: 'map' },
    { type: 'sign', x: 9, y: 8, text: 'Beyond this seal, the heart of the rot. It has been chewing on the forest\'s dreams. Make it stop.' },
    { type: 'pot', x: 2, y: 2 },
    { type: 'pot', x: 17, y: 2 },
  ],
});

// r8: BRAMBLEMAW
room(8, {
  name: 'BRAMBLEMAW, ROOT OF ROT',
  grid: [
    '####################',
    '#..................#',
    '#..g............g..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..g............g..#',
    '#..................#',
    '####################',
  ],
  doors: { s: { to: 'r7', kind: 'shutter' } },
  entities: [
    {
      type: 'bramblemaw', x: 9, y: 4, unlessFlag: 'd1_clear',
      clearFlag: 'd1_clear', relic: 'verdant',
      exitTo: { map: 'verdant_approach', x: 10, y: 5 },
    },
  ],
  onEnter(play) {
    if (!play.hasFlag('d1_clear')) play.autosave();
  },
});
