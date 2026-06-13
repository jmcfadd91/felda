// Castle Nocturne: the final gauntlet. Every tool earns its keep here.
// At the top waits Vhorrun, and beyond him, the ending.

import { dungeonRooms } from './dungeonkit.js';
import { defineMap } from '../engine/tilemap.js';
import { registerType } from '../entities/index.js';
import { Entity } from '../engine/entity.js';
import { aabbOverlap } from '../engine/physics.js';
import { TILE } from '../gfx/tiles.js';
import { COLORS as C } from '../gfx/palette.js';

const room = dungeonRooms({
  prefix: 'c',
  theme: 'castle',
  music: 'castle',
  dungeon: 'castle',
});

// Portal that rolls credits once the Sleepless King is down.
class EndPortal extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 2, 12, 12);
    this.t = 0;
    this.canCross = true;
  }

  update(play) {
    this.t++;
    if (this.t % 8 === 0) play.particles.spawn('sparkle', this.cx, this.cy, 2);
    if (aabbOverlap(this.box, play.player.box)) {
      this.dead = true;
      import('../scenes/ending.js').then(({ EndingScene }) => {
        play.game.push(new EndingScene(play));
      });
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.cx - cam.x);
    const y = Math.round(this.cy - cam.y);
    const r = 7 + Math.sin(this.t / 10) * 1.5;
    ctx.fillStyle = '#f0d048';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.arc(x, y, r - 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
registerType('endportal', EndPortal);

// c_r1: gatehouse
room(1, {
  name: 'CASTLE NOCTURNE',
  exit: { map: 'nocturne_approach', x: 14, y: 3 },
  grid: [
    '####################',
    '#..................#',
    '#..#..#..k..#..#...#',
    '#........k.........#',
    '#........k.........#',
    '#........k.........#',
    '#........k.........#',
    '#........k.........#',
    '#........k.........#',
    '#........k.........#',
    '#..#..#..k..#..#...#',
    '#........k.........#',
    '####################',
  ],
  doors: { n: 'r2' },
  entities: [
    { type: 'sign', x: 5, y: 11, text: 'The royal carpet, unswept for years. The dust keeps the shape of pacing footsteps.' },
    { type: 'wraithguard', x: 5, y: 5 },
    { type: 'gloomwisp', x: 14, y: 4 },
    { type: 'gloomwisp', x: 14, y: 8 },
  ],
});

// c_r2: the honor guard - shutters until the duel is won
room(2, {
  grid: [
    '####################',
    '#..................#',
    '#..#............#..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..#............#..#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: 'r1',
    n: { to: 'r3', kind: 'shutter' },
  },
  entities: [
    { type: 'wraithguard', x: 6, y: 4 },
    { type: 'wraithguard', x: 13, y: 8 },
    { type: 'chest', id: 'c_gems', x: 9, y: 2, contents: 'gems:30' },
  ],
});

// c_r3: the unlit chapel - flame relay in the dark
room(3, {
  dark: true,
  grid: [
    '####################',
    '#..................#',
    '#..f............f..#',
    '#..................#',
    '#.....#......#.....#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#.....#......#.....#',
    '#..................#',
    '#..f............f..#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: 'r2',
    n: { to: 'r4', kind: 'locked', id: 'c_lock1' },
  },
  entities: [
    { type: 'torch', x: 9, y: 6, lit: true },
    { type: 'torch', x: 3, y: 3, channel: 'chapel' },
    { type: 'torch', x: 16, y: 3, channel: 'chapel' },
    { type: 'torch', x: 3, y: 9, channel: 'chapel' },
    { type: 'torch', x: 16, y: 9, channel: 'chapel' },
    { type: 'gate', x: 13, y: 6, channel: 'chapel' },
    { type: 'chest', id: 'c_key1', x: 15, y: 6, contents: 'key' },
    { type: 'gloomwisp', x: 6, y: 7 },
    { type: 'gloomwisp', x: 12, y: 4 },
    { type: 'wraithguard', x: 9, y: 9 },
  ],
});

// c_r4: the broken bridge - grapple the gap, shoot the warden's eye
room(4, {
  grid: [
    '####################',
    '#..................#',
    '#.........hh.......#',
    '#..hhhhhhhhhh......#',
    '#..hhhhhhhhhh......#',
    '#..hhhhhhhhhh..x...#',
    '#..hhhhhhhhhh......#',
    '#..hhhhhhhhhh......#',
    '#..hhhhhhhhhh......#',
    '#.....hh...........#',
    '#..................#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: 'r3',
    n: 'r5',
  },
  entities: [
    { type: 'eyeswitch', x: 3, y: 10, channel: 'warden' },
    { type: 'gate', x: 16, y: 6, channel: 'warden' },
    { type: 'chest', id: 'c_item', x: 18, y: 6, contents: 'item:sword2' },
    { type: 'sign', x: 14, y: 10, text: 'The warden\'s eye never blinks. An arrow might teach it how.' },
    { type: 'voltjelly', x: 15, y: 3 },
  ],
});

// c_r5: the cracked archive - bomb your way to the master key
room(5, {
  grid: [
    '####################',
    '#..................#',
    '#.######B#########.#',
    '#.#......#.......#.#',
    '#.#.####.#.#####.#.#',
    '#.#.#..#...#...#.#.#',
    '#.#.#..#####.#.#.#.#',
    '#.#.B........#.B.#.#',
    '#.#.#########.#..#.#',
    '#.#...........#..#.#',
    '#.#############..#.#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: 'r4',
    n: { to: 'r6', kind: 'shutter' },
  },
  entities: [
    { type: 'chest', id: 'c_bosskey', x: 6, y: 5, contents: 'bosskey' },
    { type: 'chest', id: 'c_arrows', x: 14, y: 5, contents: 'arrows:15' },
    { type: 'wraithguard', x: 10, y: 9 },
    { type: 'gloomwisp', x: 5, y: 3 },
    { type: 'sign', x: 17, y: 11, text: 'Archive rules: NO NAKED FLAMES. The cracks in the shelving suggest the rule was new.' },
  ],
});

// c_r6: the last landing
room(6, {
  grid: [
    '####################',
    '#..................#',
    '#....k........k....#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#....k........k....#',
    '#..................#',
    '####################',
  ],
  doors: {
    s: 'r5',
    n: { to: 'r7', kind: 'boss', id: 'c_bossdoor' },
  },
  entities: [
    { type: 'savestatue', x: 6, y: 6 },
    { type: 'chest', id: 'c_potion', x: 13, y: 6, contents: 'potion' },
    { type: 'sign', x: 9, y: 8, text: 'You can hear him pacing above. He has not slept in nine years. Neither has his temper.' },
  ],
});

// c_r7: VHORRUN'S THRONE
room(7, {
  name: 'VHORRUN, THE SLEEPLESS KING',
  grid: [
    '####################',
    '#..................#',
    '#..k............k..#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..................#',
    '#..k............k..#',
    '#..................#',
    '####################',
  ],
  doors: { s: { to: 'r6', kind: 'shutter' } },
  entities: [
    {
      type: 'vhorrun', x: 9, y: 3, unlessFlag: 'vhorrun_down',
      clearFlag: 'vhorrun_down',
    },
    { type: 'endportal', x: 9, y: 5, ifFlag: 'vhorrun_down' },
    { type: 'npc', id: 'liora', sprite: 'npc_liora', x: 12, y: 3, wander: false, ifFlag: 'vhorrun_down' },
  ],
  onEnter(play) {
    if (!play.hasFlag('vhorrun_down')) play.autosave();
  },
});

// ---------------- dev sandbox ----------------
defineMap({
  id: 'devroom',
  name: 'DEV SANDBOX',
  theme: 'cave',
  music: 'shop',
  dungeon: 'dev',
  grid: [
    '##############################',
    '#............................#',
    '#..www..ll..hh..bb..gg..,,...#',
    '#..www..ll..hh..bb..gg..,,...#',
    '#............................#',
    '#..S..x..B..=................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#............................#',
    '##############################',
  ],
  entities: [
    { type: 'savestatue', x: 2, y: 13 },
    { type: 'chest', id: 'dev_chest', x: 4, y: 13, contents: 'gems:50' },
    { type: 'sign', x: 6, y: 13, text: 'DEV ROOM. Everything that bites, in one convenient pen.' },
    { type: 'pot', x: 8, y: 13 },
    { type: 'block', x: 10, y: 13 },
    { type: 'floorswitch', x: 12, y: 13, channel: 'dev' },
    { type: 'gate', x: 14, y: 13, channel: 'dev' },
    { type: 'crystal', x: 16, y: 13, channel: 'dev2' },
    { type: 'eyeswitch', x: 18, y: 13, channel: 'dev3' },
    { type: 'torch', x: 20, y: 13, lit: true },
    { type: 'torch', x: 22, y: 13 },
    { type: 'heartpiece', id: 'dev_hp', x: 24, y: 13 },
    { type: 'thornling', x: 5, y: 8 },
    { type: 'pricklepod', x: 8, y: 8 },
    { type: 'gloomwisp', x: 11, y: 8 },
    { type: 'emberkin', x: 14, y: 8 },
    { type: 'cindershell', x: 17, y: 8 },
    { type: 'tidemaw', x: 4, y: 2 },
    { type: 'voltjelly', x: 23, y: 8 },
    { type: 'wraithguard', x: 26, y: 8 },
    { type: 'npc', id: 'elder', sprite: 'npc_elder', x: 26, y: 13, wander: false },
    { type: 'warp', x: 27, y: 1, to: { map: 'bramblewick', x: 15, y: 9 }, kind: 'stairs' },
  ],
});
