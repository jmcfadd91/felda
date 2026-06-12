// Top HUD strip: hearts, gems, keys, equipped items.

import { VIEW_W } from '../engine/renderer.js';
import { HUD_H } from '../engine/camera.js';
import { drawText } from './textrender.js';
import { drawSprite, getSprite } from '../gfx/sprites.js';
import { COLORS as C } from '../gfx/palette.js';

export function drawHud(ctx, play) {
  const st = play.state;
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(0, HUD_H - 1, VIEW_W, 1);

  // hearts (two rows of up to 8)
  for (let i = 0; i < st.heartsMax; i++) {
    const x = 6 + (i % 8) * 9;
    const y = 3 + Math.floor(i / 8) * 9;
    const fill = st.hearts - i;
    drawHeart(ctx, x, y, fill >= 1 ? 'full' : fill >= 0.5 ? 'half' : 'empty');
  }

  // gems
  drawSprite(ctx, 'gem_green', 92, 3);
  drawText(ctx, String(st.gems).padStart(3, '0'), 101, 4, '#fff');

  // dungeon keys
  if (play.dungeonId) {
    const d = play.dungeonKeys();
    drawSprite(ctx, 'key_small', 92, 13);
    drawText(ctx, `x${d}`, 101, 14, '#fff');
  }

  // B item box
  drawItemBox(ctx, 196, 2, 'B', st.equippedB, st);
  // A sword box
  drawItemBox(ctx, 232, 2, 'A', st.items.includes('sword') ? 'sword' : null, st);

  // counters for B item
  if (st.equippedB === 'bombs') drawText(ctx, String(st.bombs), 214, 14, '#fff');
  if (st.equippedB === 'bow') drawText(ctx, String(st.arrows), 214, 14, '#fff');
}

const ITEM_ICONS = {
  sword: drawSwordIcon, galewing: i('galewing_icon'), bombs: i('bomb_pickup'),
  grapple: i('grapple_icon'), bow: i('bow_icon'), bottle: i('bottle_icon'),
  whistle: i('whistle_icon'),
};

function i(name) {
  return (ctx, x, y) => {
    try { drawSprite(ctx, name, x, y); } catch { /* icon art not loaded yet */ }
  };
}

function drawSwordIcon(ctx, x, y) {
  ctx.fillStyle = C.white;
  ctx.fillRect(x + 5, y + 1, 2, 8);
  ctx.fillStyle = C.yellow;
  ctx.fillRect(x + 3, y + 9, 6, 2);
  ctx.fillRect(x + 5, y + 11, 2, 2);
}

function drawItemBox(ctx, x, y, label, item, st) {
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(x, y, 20, 20);
  ctx.fillStyle = '#4a4a62';
  ctx.fillRect(x, y, 20, 1);
  ctx.fillRect(x, y, 1, 20);
  ctx.fillRect(x + 19, y, 1, 20);
  ctx.fillRect(x, y + 19, 20, 1);
  drawText(ctx, label, x + 14, y + 1, '#9098a0');
  if (item && ITEM_ICONS[item]) ITEM_ICONS[item](ctx, x + 3, y + 5);
}

export function drawHeart(ctx, x, y, kind) {
  const colors = { full: C.red, half: C.red, empty: '#3a3a4a' };
  // 7x7 heart
  ctx.fillStyle = kind === 'empty' ? colors.empty : colors.full;
  if (kind === 'half') {
    drawHeartShape(ctx, x, y, colors.empty, 7);
    drawHeartShape(ctx, x, y, colors.full, 4);
  } else {
    drawHeartShape(ctx, x, y, ctx.fillStyle, 7);
  }
}

function drawHeartShape(ctx, x, y, color, clipW) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, clipW, 8);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y, 2, 1);
  ctx.fillRect(x + 4, y, 2, 1);
  ctx.fillRect(x, y + 1, 7, 2);
  ctx.fillRect(x + 1, y + 3, 5, 1);
  ctx.fillRect(x + 2, y + 4, 3, 1);
  ctx.fillRect(x + 3, y + 5, 1, 1);
  ctx.restore();
}
