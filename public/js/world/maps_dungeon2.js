// Dungeon 2: The Cinder Depths. Lava, cracked stone, bombs. Boss: Magmarch.

import { dungeonRooms } from './dungeonkit.js';

const room = dungeonRooms({
  prefix: 'd2',
  theme: 'fire',
  music: 'fire',
  dungeon: 'd2',
});

// r1: entrance
room(1, {
  name: 'CINDER DEPTHS',
  exit: { map: 'scorch_trail', x: 12, y: 3 },
  grid: [
    '####################',
    '#..................#',
    '#..ll..........ll..#',
    '#..ll..........ll..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..ll..........ll..#',
    '#..ll..........ll..#',
    '#..................#',
    '####################',
  ],
  doors: { n: 'r2' },
  entities: [
    { type: 'sign', x: 5, y: 11, text: 'The mountain\'s gullet. Mind the drool.' },
    { type: 'emberkin', x: 6, y: 6 },
    { type: 'emberkin', x: 13, y: 6 },
  ],
});

// r2: lava hub
room(2, {
  grid: [
    '####################',
    '#......l...l.......#',
    '#..lll.l...l.lll...#',
    '#..lll.......lll...#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#...lll......lll...#',
    '#...lll......lll...#',
    '#......l...l.......#',
    '#......l...l.......#',
    '####################',
  ],
  doors: {
    s: 'r1',
    e: 'r3',
    w: 'r4',
    n: { to: 'r6', kind: 'locked', id: 'd2_lock1' },
  },
  entities: [
    { type: 'emberkin', x: 9, y: 5 },
    { type: 'emberkin', x: 5, y: 6 },
    { type: 'pot', x: 17, y: 1 },
    { type: 'pot', x: 17, y: 10 },
  ],
});

// r3: cindershell den - the first key
room(3, {
  grid: [
    '####################',
    '#..................#',
    '#..l............l..#',
    '#..................#',
    '#.....l......l.....#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#.....l......l.....#',
    '#..................#',
    '#..l............l..#',
    '#..................#',
    '####################',
  ],
  doors: { w: 'r2' },
  entities: [
    { type: 'cindershell', x: 9, y: 3 },
    { type: 'cindershell', x: 12, y: 8 },
    { type: 'chest', id: 'd2_key1', x: 16, y: 6, contents: 'key' },
    { type: 'chest', id: 'd2_compass', x: 3, y: 6, contents: 'compass' },
    { type: 'sign', x: 2, y: 11, text: 'Shelled walkers wear their hearths on their backs. Douse, then strike.' },
  ],
});

// r4: the bomb cache - block puzzle, then a cracked wall to spare powder
room(4, {
  grid: [
    '####################',
    '#..................#',
    '#..####....####....#',
    '#..#..........#....#',
    '#..#..........#....#',
    '#..#...####...#....#',
    '#......#..#........#',
    '#..#...####...#....#',
    '#..#..........#....#',
    '#..#..........#....#',
    '#..####BB######....#',
    '#..................#',
    '####################',
  ],
  doors: { e: 'r2' },
  entities: [
    { type: 'block', x: 12, y: 3 },
    { type: 'floorswitch', x: 12, y: 8, channel: 'd2blk' },
    { type: 'gate', x: 9, y: 5, channel: 'd2blk' },
    { type: 'chest', id: 'd2_item', x: 9, y: 6, contents: 'item:bombs' },
    { type: 'chest', id: 'd2_spare', x: 8, y: 11, contents: 'bombs:5' },
    { type: 'sign', x: 16, y: 6, text: 'Quartermaster\'s note: powder behind the cracked stones. Do not store next to the... oh. Oh no.' },
    { type: 'emberkin', x: 5, y: 4 },
  ],
});

// r6: volt gallery - second key behind a crystal gate
room(6, {
  grid: [
    '####################',
    '#..................#',
    '#...#..........#...#',
    '#..................#',
    '#..................#',
    '#.......ll.........#',
    '#.......ll.........#',
    '#..................#',
    '#..................#',
    '#...#..........#...#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: { to: 'r2', kind: 'locked', id: 'd2_lock1' },
    n: { to: 'r7', kind: 'locked', id: 'd2_lock2' },
    e: 'r8',
  },
  entities: [
    { type: 'voltjelly', x: 6, y: 4 },
    { type: 'voltjelly', x: 13, y: 8 },
    { type: 'crystal', x: 16, y: 2, channel: 'd2cr' },
    { type: 'gate', x: 3, y: 6, channel: 'd2cr' },
    { type: 'chest', id: 'd2_key2', x: 1, y: 6, contents: 'key' },
  ],
});

// r8: the master key vault
room(8, {
  grid: [
    '####################',
    '#..................#',
    '#..ll..........ll..#',
    '#..................#',
    '#.....########.....#',
    '#.....#......#.....#',
    '#.....B......#.....#',
    '#.....#......#.....#',
    '#.....########.....#',
    '#..................#',
    '#..ll..........ll..#',
    '#..................#',
    '####################',
  ],
  doors: { w: 'r6' },
  entities: [
    { type: 'cindershell', x: 9, y: 2 },
    { type: 'cindershell', x: 9, y: 10 },
    { type: 'chest', id: 'd2_bosskey', x: 9, y: 6, contents: 'bosskey' },
    { type: 'sign', x: 3, y: 6, text: 'The vault wall never recovered from the quartermaster\'s incident.' },
  ],
});

// r7: antechamber
room(7, {
  grid: [
    '####################',
    '#..................#',
    '#..l............l..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..l............l..#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: { to: 'r6', kind: 'locked', id: 'd2_lock2' },
    n: { to: 'r9', kind: 'boss', id: 'd2_bossdoor' },
  },
  entities: [
    { type: 'savestatue', x: 6, y: 6 },
    { type: 'chest', id: 'd2_map', x: 13, y: 6, contents: 'map' },
    { type: 'sign', x: 9, y: 8, text: 'Hoofprints the size of cartwheels, all running TOWARD the heat. Brave or stupid. Soon: both.' },
    { type: 'pot', x: 2, y: 11 },
    { type: 'pot', x: 17, y: 11 },
  ],
});

// r9: MAGMARCH
room(9, {
  name: 'MAGMARCH, THE FURNACE HOOF',
  grid: [
    '####################',
    '#..................#',
    '#.l..............l.#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#.l..............l.#',
    '#..................#',
    '####################',
  ],
  doors: { s: { to: 'r7', kind: 'shutter' } },
  entities: [
    {
      type: 'magmarch', x: 9, y: 4, unlessFlag: 'd2_clear',
      clearFlag: 'd2_clear', relic: 'cinder',
      exitTo: { map: 'scorch_trail', x: 12, y: 3 },
    },
  ],
  onEnter(play) {
    if (!play.hasFlag('d2_clear')) play.autosave();
  },
});
