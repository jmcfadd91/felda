// Dungeon 3: The Sunken Sanctum. Water levels bow to crystals; the Grapple
// Fang crosses what the water won't yield. Boss: the Abyssal Choir.

import { dungeonRooms } from './dungeonkit.js';

const room = dungeonRooms({
  prefix: 'd3',
  theme: 'water_dungeon',
  music: 'water',
  dungeon: 'd3',
});

// r1: drowned stairway
room(1, {
  name: 'SUNKEN SANCTUM',
  exit: { map: 'lake', x: 13, y: 8 },
  grid: [
    '####################',
    '#..................#',
    '#.www............ww#',
    '#.www............ww#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#.ww............www#',
    '#.ww............www#',
    '#..................#',
    '####################',
  ],
  doors: { n: 'r2' },
  entities: [
    { type: 'sign', x: 5, y: 11, text: 'Everything here is patient. The water taught it how.' },
    { type: 'gloomwisp', x: 6, y: 4 },
    { type: 'voltjelly', x: 13, y: 8 },
  ],
});

// r2: moat hub
room(2, {
  grid: [
    '####################',
    '#..................#',
    '#..wwwwwwwwwwwww...#',
    '#..wwwwwwwwwwwww...#',
    '#..ww.........ww...#',
    '#..ww.........ww...#',
    '#..ww....=....ww...#',
    '#..ww....=....ww...#',
    '#..ww.........ww...#',
    '#..wwwwww=wwwwww...#',
    '#........=.........#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: 'r1',
    e: 'r3',
    w: 'r4',
    n: { to: 'r6', kind: 'locked', id: 'd3_lock1' },
  },
  entities: [
    { type: 'tidemaw', x: 5, y: 2 },
    { type: 'tidemaw', x: 14, y: 9 },
    { type: 'pot', x: 9, y: 5 },
  ],
});

// r3: the island key - wake the crystal to part the water
room(3, {
  grid: [
    '####################',
    '#..................#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..www........www..#',
    '#..www........www..#',
    '#..www........www..#',
    '#..www........www..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: { w: 'r2' },
  entities: [
    { type: 'crystal', x: 9, y: 5, channel: 'd3r3' },
    { type: 'tileswap', x: 1, y: 1, channel: 'd3r3', to: '=', tiles: [[9, 8], [9, 9], [10, 8], [10, 9]] },
    { type: 'chest', id: 'd3_key1', x: 10, y: 5, contents: 'key' },
    { type: 'sign', x: 3, y: 11, text: 'The island ignores you. The crystal on it might not. Your wing knows the way.' },
    { type: 'voltjelly', x: 15, y: 10 },
  ],
});

// r4: block puzzle guards the Grapple Fang
room(4, {
  grid: [
    '####################',
    '#..................#',
    '#.####........####.#',
    '#.#..............#.#',
    '#.#..............#.#',
    '#.#....######....#.#',
    '#......#....#......#',
    '#.#....#....#....#.#',
    '#.#....######....#.#',
    '#.#..............#.#',
    '#.####........####.#',
    '#..................#',
    '####################',
  ],
  doors: { e: 'r2' },
  entities: [
    { type: 'block', x: 5, y: 6 },
    { type: 'floorswitch', x: 5, y: 9, channel: 'd3blk' },
    { type: 'gate', x: 13, y: 6, channel: 'd3blk' },
    { type: 'chest', id: 'd3_item', x: 10, y: 7, contents: 'item:grapple' },
    { type: 'tidemaw', x: 9, y: 3 },
    { type: 'sign', x: 16, y: 11, text: 'The Sanctum\'s fang waits inside. It bites only stone, and only for you.' },
  ],
});

// r6: tidemaw nest - grapple across to the second key
room(6, {
  grid: [
    '####################',
    '#..................#',
    '#......wwwwwww.....#',
    '#..S...wwwwwww..S..#',
    '#......wwwwwww.....#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#......wwwwwww.....#',
    '#..S...wwwwwww..S..#',
    '#......wwwwwww.....#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: { to: 'r2', kind: 'locked', id: 'd3_lock1' },
    n: { to: 'r8', kind: 'locked', id: 'd3_lock2' },
    w: 'r5',
  },
  entities: [
    { type: 'tidemaw', x: 9, y: 6 },
    { type: 'tidemaw', x: 12, y: 6 },
    { type: 'chest', id: 'd3_key2', x: 17, y: 6, contents: 'key' },
    { type: 'chest', id: 'd3_map', x: 1, y: 1, contents: 'map' },
  ],
});

// r5: the drowned vault - master key under the pool
room(5, {
  grid: [
    '####################',
    '#..................#',
    '#.x..............x.#',
    '#..................#',
    '#....wwwwwwwwww....#',
    '#....wwwwwwwwww....#',
    '#....wwwwwwwwww....#',
    '#....wwwwwwwwww....#',
    '#....wwwwwwwwww....#',
    '#..................#',
    '#.x..............x.#',
    '#..................#',
    '####################',
  ],
  doors: { e: 'r6' },
  entities: [
    { type: 'crystal', x: 9, y: 1, channel: 'd3r5' },
    { type: 'tileswap', x: 1, y: 1, channel: 'd3r5', to: '.', tiles: [[8, 5], [9, 5], [10, 5], [8, 6], [9, 6], [10, 6], [8, 7], [9, 7], [10, 7]] },
    { type: 'chest', id: 'd3_bosskey', x: 9, y: 6, contents: 'bosskey' },
    { type: 'chest', id: 'd3_compass', x: 17, y: 11, contents: 'compass' },
    { type: 'voltjelly', x: 5, y: 9 },
    { type: 'voltjelly', x: 14, y: 3 },
    { type: 'sign', x: 3, y: 11, text: 'The pool keeps the Sanctum\'s last secret. Crystals command; water obeys.' },
  ],
});

// r8: antechamber
room(8, {
  grid: [
    '####################',
    '#..................#',
    '#..ww..........ww..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..ww..........ww..#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: { to: 'r6', kind: 'locked', id: 'd3_lock2' },
    n: { to: 'r9', kind: 'boss', id: 'd3_bossdoor' },
  },
  entities: [
    { type: 'savestatue', x: 6, y: 6 },
    { type: 'sign', x: 9, y: 8, text: 'Three voices sing beyond this seal. The song is hungry. Bring your own verse.' },
    { type: 'pot', x: 2, y: 2 },
    { type: 'pot', x: 17, y: 2 },
  ],
});

// r9: THE ABYSSAL CHOIR
room(9, {
  name: 'THE ABYSSAL CHOIR',
  grid: [
    '####################',
    '#..................#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..wwwwwwwwwwwwww..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: { s: { to: 'r8', kind: 'shutter' } },
  entities: [
    {
      type: 'abyssalchoir', x: 9, y: 5, unlessFlag: 'd3_clear',
      clearFlag: 'd3_clear', relic: 'tide',
      exitTo: { map: 'lake', x: 13, y: 8 },
    },
  ],
  onEnter(play) {
    if (!play.hasFlag('d3_clear')) play.autosave();
  },
});
