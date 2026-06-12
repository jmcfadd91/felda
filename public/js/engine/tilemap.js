// String-grid tile maps. Each map definition is authored as rows of legend
// chars; the runtime Tilemap holds a mutable copy (bushes get cut, walls get
// bombed) plus the entity spawn list and exits.

import { TILE, TILE_TYPES, getTileset, tileVariant } from '../gfx/tiles.js';

export { TILE };

// Global legend; maps can override per-char.
export const DEFAULT_LEGEND = {
  '.': 'floor',
  ',': 'flowers',
  'g': 'tallgrass',
  'p': 'path',
  's': 'sand',
  '#': 'wall',
  'r': 'cliff',
  'T': 'tree',
  'w': 'water',
  'l': 'lava',
  'h': 'pit',
  '-': 'void',
  '=': 'bridge',
  'f': 'fence',
  'b': 'bushtile',   // bush: floor tile + cuttable overlay
  'S': 'stump',
  'x': 'post',
  'B': 'crackwall',
  'c': 'cave',
  '>': 'stairs',
  'k': 'carpet',
  'P': 'plank',
};

const registry = new Map();

export function defineMap(def) {
  if (registry.has(def.id)) throw new Error(`Duplicate map id: ${def.id}`);
  const w = def.grid[0].length;
  for (let i = 0; i < def.grid.length; i++) {
    if (def.grid[i].length !== w) {
      throw new Error(`Map ${def.id}: row ${i} is ${def.grid[i].length} chars, expected ${w}`);
    }
  }
  registry.set(def.id, def);
  return def;
}

export function getMapDef(id) {
  const def = registry.get(id);
  if (!def) throw new Error(`Unknown map: ${id}`);
  return def;
}

export function allMapIds() {
  return [...registry.keys()];
}

export class Tilemap {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.theme = def.theme || 'overworld';
    this.legend = { ...DEFAULT_LEGEND, ...(def.legend || {}) };
    this.grid = def.grid.map(row => row.split(''));
    this.h = this.grid.length;
    this.w = this.grid[0].length;
    this.exits = def.exits || {};
    this.dark = !!def.dark;
    // Bushes are tracked as a tile overlay set so cutting them is per-tile.
    this.bushes = new Set();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.typeAt(x, y) === 'bushtile') this.bushes.add(y * this.w + x);
      }
    }
  }

  typeAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return 'void';
    return this.legend[this.grid[ty][tx]] || 'floor';
  }

  flagsAt(tx, ty) {
    const type = TILE_TYPES[this.typeAt(tx, ty)] || {};
    if (type === TILE_TYPES.bushtile || this.typeAt(tx, ty) === 'bushtile') {
      // Uncut bush is solid+cuttable; cut bush is plain floor.
      if (this.bushes.has(ty * this.w + tx)) return { solid: true, cuttable: true };
      return {};
    }
    return type;
  }

  solidAt(tx, ty) { return !!this.flagsAt(tx, ty).solid; }

  setTile(tx, ty, ch) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
    this.grid[ty][tx] = ch;
    this.bushes.delete(ty * this.w + tx);
  }

  cutBush(tx, ty) {
    this.bushes.delete(ty * this.w + tx);
  }

  get pixelW() { return this.w * TILE; }
  get pixelH() { return this.h * TILE; }

  // Draw ground layer for the camera viewport.
  draw(ctx, camera, ticks, themeOverride = null) {
    const set = getTileset(themeOverride || this.theme);
    const x0 = Math.max(0, Math.floor(camera.x / TILE));
    const y0 = Math.max(0, Math.floor(camera.y / TILE));
    const x1 = Math.min(this.w - 1, Math.ceil((camera.x + camera.viewW) / TILE));
    const y1 = Math.min(this.h - 1, Math.ceil((camera.y + camera.viewH) / TILE));
    const animFrame = Math.floor(ticks / 12);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const name = this.typeAt(tx, ty);
        const t = set[name] || set.floor;
        const idx = t.anim ? animFrame % t.frames : tileVariant(tx, ty) % t.frames;
        ctx.drawImage(t.strip, idx * TILE, 0, TILE, TILE,
          tx * TILE - Math.round(camera.x), ty * TILE - Math.round(camera.y), TILE, TILE);
      }
    }
  }
}
