// Sprite baker: pixel-string definitions -> offscreen canvases, baked once
// and cached. Supports horizontal flips and palette swaps to multiply art.

import { SPRITE_DEFS } from './spritedata.js';
import { SWAPS } from './palette.js';

const cache = new Map(); // "name|flip|swap" -> canvas

function bake(def, flip, swapName) {
  const rows = def.rows;
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const swap = swapName ? SWAPS[swapName] || {} : {};
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      let color = def.pal[ch];
      if (!color) continue;
      if (swap[color]) color = swap[color];
      ctx.fillStyle = color;
      ctx.fillRect(flip ? w - 1 - x : x, y, 1, 1);
    }
  }
  return c;
}

export function getSprite(name, { flip = false, swap = null } = {}) {
  const key = `${name}|${flip ? 1 : 0}|${swap || ''}`;
  let c = cache.get(key);
  if (!c) {
    const def = SPRITE_DEFS[name];
    if (!def) throw new Error(`Unknown sprite: ${name}`);
    c = bake(def, flip, swap);
    cache.set(key, c);
  }
  return c;
}

export function drawSprite(ctx, name, x, y, opts = {}) {
  const s = getSprite(name, opts);
  ctx.drawImage(s, Math.round(x), Math.round(y));
}

export function spriteSize(name) {
  const def = SPRITE_DEFS[name];
  return { w: def.rows[0].length, h: def.rows.length };
}

export function hasSprite(name) {
  return !!SPRITE_DEFS[name];
}
