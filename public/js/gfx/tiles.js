// Procedural tileset painters. Each tile type paints 16x16 pixels from code
// (with deterministic per-variant noise), baked once per theme into canvases.

import { COLORS as C } from './palette.js';

export const TILE = 16;
const FRAMES = 4;   // animated tiles (water, lava) bake 4 frames
const VARIANTS = 4; // static tiles bake 4 noise variants

// Theme color sets give each area its own feel with shared painters.
export const THEMES = {
  overworld: {
    floor: C.grass, floorDark: C.grassDark, floorLight: C.grassLight,
    path: C.dirt, pathDark: C.dirtDark, wall: C.stone, wallDark: C.stoneDark,
    wallLight: C.stoneLight, accent: C.green, accentDark: C.greenDark,
  },
  dusk: {
    floor: C.duskGrass, floorDark: '#404838', floorLight: '#747c64',
    path: '#8a7858', pathDark: '#6a5c44', wall: '#6a6a80', wallDark: '#46465c',
    wallLight: '#8e8ea4', accent: '#5c6450', accentDark: '#404838',
  },
  town: {
    floor: C.grass, floorDark: C.grassDark, floorLight: C.grassLight,
    path: C.sand, pathDark: C.tan, wall: C.stone, wallDark: C.stoneDark,
    wallLight: C.stoneLight, accent: C.wood, accentDark: C.woodDark,
  },
  forest: {
    floor: '#3c8434', floorDark: '#2a6026', floorLight: '#54a448',
    path: C.dirtDark, pathDark: '#6e5230', wall: '#4a6840', wallDark: '#32482c',
    wallLight: '#647e58', accent: C.greenDark, accentDark: '#1e4420',
  },
  dungeon_green: {
    floor: '#687860', floorDark: '#4c5a46', floorLight: '#84947a',
    path: '#5a6a52', pathDark: '#42503c', wall: '#3e5238', wallDark: '#28361e',
    wallLight: '#5a7050', accent: '#48a048', accentDark: '#2a702e',
  },
  fire: {
    floor: '#8a6a58', floorDark: '#6a4c3e', floorLight: '#a88874',
    path: '#7a5a48', pathDark: '#5a4034', wall: '#6a4438', wallDark: '#482c22',
    wallLight: '#8a6050', accent: C.lava, accentDark: C.lavaDark,
  },
  water_dungeon: {
    floor: '#5a7a8a', floorDark: '#42596a', floorLight: '#7a9aaa',
    path: '#4c6a7a', pathDark: '#385060', wall: '#3a5468', wallDark: '#263a48',
    wallLight: '#567488', accent: C.water, accentDark: C.waterDeep,
  },
  castle: {
    floor: '#5c5870', floorDark: '#444052', floorLight: '#787490',
    path: '#504c62', pathDark: '#3a3648', wall: '#3c3850', wallDark: '#262234',
    wallLight: '#5a5572', accent: C.purple, accentDark: C.purpleDark,
  },
  cave: {
    floor: '#6a6058', floorDark: '#4e4640', floorLight: '#867c72',
    path: '#5e5650', pathDark: '#46403a', wall: '#403830', wallDark: '#2a241e',
    wallLight: '#5c544a', accent: C.brown, accentDark: C.brownDark,
  },
};

// Deterministic noise so variants look intentional and stable.
function hash(a, b, c2) {
  let h = (a * 374761393 + b * 668265263 + c2 * 2147483647) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function speckle(ctx, v, color, count, seed) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = Math.floor(hash(v, i, seed) * 16);
    const y = Math.floor(hash(v, i + 50, seed) * 16);
    ctx.fillRect(x, y, 1, 1);
  }
}

// Painters: (ctx, theme, frameOrVariant) drawing into a 16x16 origin.
const PAINTERS = {
  floor(ctx, t, v) {
    ctx.fillStyle = t.floor;
    ctx.fillRect(0, 0, 16, 16);
    speckle(ctx, v, t.floorDark, 5, 1);
    speckle(ctx, v, t.floorLight, 4, 2);
  },
  flowers(ctx, t, v) {
    PAINTERS.floor(ctx, t, v);
    const fx = Math.floor(hash(v, 1, 9) * 10) + 2;
    const fy = Math.floor(hash(v, 2, 9) * 10) + 2;
    ctx.fillStyle = v % 2 ? C.yellow : C.white;
    ctx.fillRect(fx, fy, 2, 2);
    ctx.fillStyle = C.red;
    ctx.fillRect((fx + 7) % 13 + 1, (fy + 5) % 13 + 1, 2, 2);
  },
  tallgrass(ctx, t, v) {
    PAINTERS.floor(ctx, t, v);
    ctx.fillStyle = t.floorDark;
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(hash(v, i, 7) * 14) + 1;
      const y = Math.floor(hash(v, i + 20, 7) * 8) + 6;
      ctx.fillRect(x, y, 1, 4);
      ctx.fillRect(x + 1, y + 1, 1, 3);
    }
  },
  path(ctx, t, v) {
    ctx.fillStyle = t.path;
    ctx.fillRect(0, 0, 16, 16);
    speckle(ctx, v, t.pathDark, 6, 3);
  },
  sand(ctx, t, v) {
    ctx.fillStyle = C.sand;
    ctx.fillRect(0, 0, 16, 16);
    speckle(ctx, v, C.tan, 6, 4);
  },
  wall(ctx, t, v) {
    ctx.fillStyle = t.wall;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = t.wallDark;
    // brick courses
    ctx.fillRect(0, 3, 16, 1);
    ctx.fillRect(0, 7, 16, 1);
    ctx.fillRect(0, 11, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(4, 0, 1, 3);
    ctx.fillRect(12, 4, 1, 3);
    ctx.fillRect(4, 8, 1, 3);
    ctx.fillRect(12, 12, 1, 3);
    ctx.fillStyle = t.wallLight;
    ctx.fillRect(0, 0, 16, 1);
    speckle(ctx, v, t.wallLight, 3, 5);
  },
  cliff(ctx, t, v) {
    ctx.fillStyle = t.wall;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = t.wallLight;
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillStyle = t.wallDark;
    ctx.fillRect(0, 13, 16, 3);
    speckle(ctx, v, t.wallDark, 5, 6);
    speckle(ctx, v, t.wallLight, 3, 7);
  },
  tree(ctx, t, v) {
    PAINTERS.floor(ctx, t, v);
    ctx.fillStyle = C.brownDark;
    ctx.fillRect(6, 11, 4, 5);
    ctx.fillStyle = t.accentDark;
    ctx.fillRect(2, 4, 12, 8);
    ctx.fillRect(4, 2, 8, 2);
    ctx.fillStyle = t.accent;
    ctx.fillRect(3, 3, 9, 7);
    ctx.fillRect(5, 1, 6, 2);
    speckle(ctx, v, t.accentDark, 6, 8);
  },
  water(ctx, t, f) {
    ctx.fillStyle = C.water;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = C.waterLight;
    const off = f * 2;
    for (let i = 0; i < 3; i++) {
      const y = (i * 6 + off) % 16;
      ctx.fillRect((i * 5 + f) % 12, y, 4, 1);
    }
    ctx.fillStyle = C.waterDeep;
    ctx.fillRect((8 + f * 3) % 14, (12 + f) % 16, 3, 1);
  },
  lava(ctx, t, f) {
    ctx.fillStyle = C.lava;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = C.lavaLight;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect((i * 6 + f * 2) % 14, (i * 5 + f * 3) % 15, 3, 2);
    }
    ctx.fillStyle = C.lavaDark;
    ctx.fillRect((10 - f * 2 + 16) % 13, (3 + f * 2) % 14, 4, 1);
  },
  pit(ctx) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#202030';
    ctx.fillRect(0, 0, 16, 2);
  },
  void(ctx) {
    ctx.fillStyle = C.black;
    ctx.fillRect(0, 0, 16, 16);
  },
  bridge(ctx, t, v) {
    PAINTERS.water(ctx, t, v % FRAMES);
    ctx.fillStyle = C.wood;
    ctx.fillRect(0, 1, 16, 14);
    ctx.fillStyle = C.woodDark;
    for (let y = 1; y < 15; y += 4) ctx.fillRect(0, y, 16, 1);
    ctx.fillRect(0, 14, 16, 1);
  },
  fence(ctx, t, v) {
    PAINTERS.floor(ctx, t, v);
    ctx.fillStyle = C.woodDark;
    ctx.fillRect(2, 4, 3, 10);
    ctx.fillRect(11, 4, 3, 10);
    ctx.fillStyle = C.wood;
    ctx.fillRect(0, 6, 16, 2);
    ctx.fillRect(0, 10, 16, 2);
  },
  stump(ctx, t, v) {
    PAINTERS.floor(ctx, t, v);
    ctx.fillStyle = C.brownDark;
    ctx.fillRect(4, 6, 8, 7);
    ctx.fillStyle = C.brown;
    ctx.fillRect(5, 5, 6, 3);
    ctx.fillStyle = C.tan;
    ctx.fillRect(6, 6, 4, 1);
  },
  post(ctx, t, v) {
    PAINTERS.floor(ctx, t, v);
    ctx.fillStyle = t.wallDark;
    ctx.fillRect(5, 3, 6, 11);
    ctx.fillStyle = t.wallLight;
    ctx.fillRect(5, 3, 6, 2);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(7, 7, 2, 2);
  },
  crackwall(ctx, t, v) {
    PAINTERS.wall(ctx, t, v);
    ctx.fillStyle = C.black;
    ctx.fillRect(7, 2, 1, 4);
    ctx.fillRect(8, 6, 1, 3);
    ctx.fillRect(6, 9, 1, 3);
    ctx.fillRect(9, 9, 1, 2);
    ctx.fillRect(7, 12, 1, 3);
  },
  cave(ctx, t, v) {
    PAINTERS.cliff(ctx, t, v);
    ctx.fillStyle = C.black;
    ctx.fillRect(4, 4, 8, 12);
    ctx.fillRect(3, 6, 10, 10);
  },
  stairs(ctx, t) {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? t.wallLight : t.wall;
      ctx.fillRect(0, i * 4, 16, 4);
      ctx.fillStyle = t.wallDark;
      ctx.fillRect(0, i * 4 + 3, 16, 1);
    }
  },
  carpet(ctx, t, v) {
    ctx.fillStyle = C.redDark;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = C.red;
    ctx.fillRect(2, 0, 12, 16);
    speckle(ctx, v, C.yellow, 2, 11);
  },
  plank(ctx, t, v) {
    ctx.fillStyle = C.wood;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = C.woodDark;
    ctx.fillRect(0, 5, 16, 1);
    ctx.fillRect(0, 11, 16, 1);
    speckle(ctx, v, C.woodDark, 3, 12);
  },
};

// Tile type registry: char legends map to these names (see tilemap.js).
// flags: solid, water, lava, pit, cuttable, bombable, hookable, damage, anim
export const TILE_TYPES = {
  floor:     { paint: 'floor' },
  flowers:   { paint: 'flowers' },
  tallgrass: { paint: 'tallgrass' },
  path:      { paint: 'path' },
  sand:      { paint: 'sand' },
  wall:      { paint: 'wall', solid: true },
  cliff:     { paint: 'cliff', solid: true },
  tree:      { paint: 'tree', solid: true },
  water:     { paint: 'water', water: true, anim: true },
  lava:      { paint: 'lava', lava: true, anim: true },
  pit:       { paint: 'pit', pit: true },
  void:      { paint: 'void', solid: true },
  bridge:    { paint: 'bridge' },
  fence:     { paint: 'fence', solid: true },
  bushtile:  { paint: 'floor' }, // bush sprite drawn over floor; see tilemap
  stump:     { paint: 'stump', solid: true, hookable: true },
  post:      { paint: 'post', solid: true, hookable: true },
  crackwall: { paint: 'crackwall', solid: true, bombable: true },
  cave:      { paint: 'cave', solid: true },
  stairs:    { paint: 'stairs' },
  carpet:    { paint: 'carpet' },
  plank:     { paint: 'plank' },
};

// Baked tilesets: theme -> typeName -> canvas strip [frames/variants].
const baked = new Map();

export function getTileset(themeName) {
  let set = baked.get(themeName);
  if (set) return set;
  const theme = THEMES[themeName] || THEMES.overworld;
  set = {};
  for (const [name, type] of Object.entries(TILE_TYPES)) {
    const n = type.anim ? FRAMES : VARIANTS;
    const strip = document.createElement('canvas');
    strip.width = TILE * n;
    strip.height = TILE;
    const ctx = strip.getContext('2d');
    for (let i = 0; i < n; i++) {
      ctx.save();
      ctx.translate(i * TILE, 0);
      ctx.beginPath();
      ctx.rect(0, 0, TILE, TILE);
      ctx.clip();
      PAINTERS[type.paint](ctx, theme, i);
      ctx.restore();
    }
    set[name] = { strip, frames: n, anim: !!type.anim };
  }
  baked.set(themeName, set);
  return set;
}

export function tileVariant(tx, ty) {
  return Math.floor(hash(tx, ty, 99) * VARIANTS);
}
