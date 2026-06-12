// AABB movement against solid tiles, resolved per-axis for wall sliding,
// with a small corner nudge so doorways feel forgiving.

import { TILE } from '../gfx/tiles.js';

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function collidesTiles(map, x, y, w, h, ent) {
  const x0 = Math.floor(x / TILE);
  const y0 = Math.floor(y / TILE);
  const x1 = Math.floor((x + w - 0.01) / TILE);
  const y1 = Math.floor((y + h - 0.01) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const f = map.flagsAt(tx, ty);
      if (f.solid) return true;
      if ((f.water || f.lava || f.pit) && !ent?.canCross) return true;
    }
  }
  return false;
}

// Move entity by (dx, dy); returns {hitX, hitY}.
export function moveEntity(ent, map, dx, dy, solids = []) {
  const res = { hitX: false, hitY: false };
  const blocked = (x, y) =>
    collidesTiles(map, x, y, ent.w, ent.h, ent) ||
    solids.some(s => s !== ent && aabbOverlap({ x, y, w: ent.w, h: ent.h }, s));

  if (dx !== 0) {
    if (!blocked(ent.x + dx, ent.y)) {
      ent.x += dx;
    } else {
      // corner nudge: if only one end is blocked, slide vertically around it
      const nudge = cornerNudge(v => blocked(ent.x + dx, ent.y + v), 3);
      if (nudge !== null && !blocked(ent.x, ent.y + Math.sign(nudge))) {
        ent.y += Math.sign(nudge) * Math.min(Math.abs(dx), 1);
      }
      res.hitX = true;
    }
  }
  if (dy !== 0) {
    if (!blocked(ent.x, ent.y + dy)) {
      ent.y += dy;
    } else {
      const nudge = cornerNudge(v => blocked(ent.x + v, ent.y + dy), 3);
      if (nudge !== null && !blocked(ent.x + Math.sign(nudge), ent.y)) {
        ent.x += Math.sign(nudge) * Math.min(Math.abs(dy), 1);
      }
      res.hitY = true;
    }
  }
  return res;
}

function cornerNudge(blockedAt, max) {
  for (let n = 1; n <= max; n++) {
    if (!blockedAt(n)) return n;
    if (!blockedAt(-n)) return -n;
  }
  return null;
}

// Tile flags under the entity's center (for water/lava/pit checks).
export function tileUnder(ent, map) {
  const cx = Math.floor((ent.x + ent.w / 2) / TILE);
  const cy = Math.floor((ent.y + ent.h / 2) / TILE);
  return map.flagsAt(cx, cy);
}
