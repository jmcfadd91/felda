// Pause/inventory screen and the town shop.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawText, drawTextCentered } from './textrender.js';
import { drawHeart, drawItemIcon } from './hud.js';
import { drawSprite } from '../gfx/sprites.js';
import { COLORS as C } from '../gfx/palette.js';
import { nextGoalText, relicCount } from '../story/flags.js';
import { MELODIES } from '../story/melodies.js';
import { persist } from '../engine/save.js';
import { sfx } from '../audio/sfx.js';

const ITEM_LIST = ['galewing', 'bombs', 'grapple', 'bow', 'bottle', 'whistle'];
const ITEM_NAMES = {
  galewing: 'GALEWING', bombs: 'BOMBS', grapple: 'GRAPPLE FANG',
  bow: 'SYLVAN BOW', bottle: 'BOTTLE', whistle: 'WHISTLE OF ERAS',
};
const ITEM_DESC = {
  galewing: 'Hurl to stun, cut, and fetch.',
  bombs: 'Blasts cracked stone walls.',
  grapple: 'Latch stumps and rings to cross.',
  bow: 'Strikes eyes and distant foes.',
  bottle: 'Drink to restore all hearts.',
  whistle: 'Play the old kingdom\'s songs.',
};

export class PauseScene {
  constructor(play) {
    this.play = play;
    this.cursor = 0;
    this.transparentDraw = true;
    this.quitArm = 0;
    sfx('select');
  }

  ownedItems() {
    return ITEM_LIST.filter(i => this.play.state.items.includes(i) ||
      (i === 'bottle' && this.play.state.bottlePotion));
  }

  update(game) {
    const input = game.input;
    const owned = this.ownedItems();
    if (input.justPressed('pause') || input.justPressed('b')) {
      game.pop();
      sfx('cursor');
      return;
    }
    if (input.justPressed('left')) { this.cursor = Math.max(0, this.cursor - 1); sfx('cursor'); }
    if (input.justPressed('right')) { this.cursor = Math.min(Math.max(owned.length - 1, 0), this.cursor + 1); sfx('cursor'); }
    if (input.justPressed('a') || input.justPressed('interact')) {
      const item = owned[this.cursor];
      if (item) {
        this.play.state.equippedB = item;
        sfx('select');
      }
    }
    if (input.justPressed('down')) {
      this.quitArm = this.quitArm ? 0 : 1;
      sfx('cursor');
    }
    if (this.quitArm && input.justPressed('up')) { this.quitArm = 0; sfx('cursor'); }
    if (this.quitArm && (input.justPressed('a') || input.justPressed('interact'))) {
      // save & quit to title
      this.play.checkpointHere();
      sfx('save');
      import('../scenes/title.js').then(({ TitleScene }) => {
        game.replace(new TitleScene());
      });
    }
  }

  draw(game, ctx) {
    const st = this.play.state;
    ctx.fillStyle = 'rgba(8,8,22,0.93)';
    ctx.fillRect(12, 12, VIEW_W - 24, VIEW_H - 24);
    ctx.strokeStyle = '#d8c878';
    ctx.strokeRect(13.5, 13.5, VIEW_W - 27, VIEW_H - 27);

    drawTextCentered(ctx, '- ADVENTURE LOG -', VIEW_W / 2, 20, '#f0d048');

    // items row
    drawText(ctx, 'ITEMS (A: EQUIP TO B)', 24, 36, '#9098a0');
    const owned = this.ownedItems();
    if (this.cursor >= owned.length) this.cursor = Math.max(0, owned.length - 1);
    ITEM_LIST.forEach((item, i) => {
      const x = 24 + i * 30;
      const y = 48;
      const has = owned.includes(item);
      const sel = owned[this.cursor] === item;
      ctx.fillStyle = sel ? '#3a3a5a' : '#22222f';
      ctx.fillRect(x, y, 26, 26);
      if (st.equippedB === item) {
        ctx.strokeStyle = '#8ef0a0';
        ctx.strokeRect(x + 0.5, y + 0.5, 25, 25);
      } else if (sel) {
        ctx.strokeStyle = '#f0d048';
        ctx.strokeRect(x + 0.5, y + 0.5, 25, 25);
      }
      if (has) drawItemIcon(ctx, item, x + 5, y + 5);
    });
    const selItem = owned[this.cursor];
    if (selItem) {
      drawText(ctx, ITEM_NAMES[selItem], 24, 80, '#f8f8f8');
      drawText(ctx, ITEM_DESC[selItem], 24, 90, '#9098a0');
    }

    // status
    drawText(ctx, 'HEARTS', 24, 108, '#9098a0');
    for (let i = 0; i < st.heartsMax; i++) {
      drawHeart(ctx, 70 + (i % 8) * 9, 107 + Math.floor(i / 8) * 9, st.hearts - i >= 1 ? 'full' : st.hearts - i >= 0.5 ? 'half' : 'empty');
    }
    drawText(ctx, `GEMS ${st.gems}   SHARDS ${st.heartPieces}/4`, 24, 126, '#9098a0');

    // relics
    drawText(ctx, 'RELICS', 24, 140, '#9098a0');
    const relics = ['relic_verdant', 'relic_cinder', 'relic_tide'];
    const relicColors = [C.green, C.lava, C.water];
    relics.forEach((r, i) => {
      const has = st.flags.includes(r);
      ctx.fillStyle = has ? relicColors[i] : '#2a2a3a';
      ctx.fillRect(70 + i * 14, 139, 8, 8);
    });

    // melodies
    drawText(ctx, 'SONGS', 24, 154, '#9098a0');
    st.melodies.forEach((m, i) => {
      drawText(ctx, MELODIES[m]?.name || m, 70, 154 + i * 10, '#b0a8f0');
    });

    // goal
    drawText(ctx, 'GOAL:', 24, 196, '#f0d048');
    const goal = nextGoalText(st);
    drawText(ctx, goal.length > 44 ? goal.slice(0, 44) : goal, 24, 206, '#f8f8f8');
    if (goal.length > 44) drawText(ctx, goal.slice(44), 24, 215, '#f8f8f8');

    drawTextCentered(ctx, this.quitArm ? 'A: SAVE AND QUIT  UP: CANCEL' : 'ESC: RESUME   DOWN: SAVE+QUIT', VIEW_W / 2, VIEW_H - 22, this.quitArm ? '#f08080' : '#9098a0');
  }
}

// ---------------- Shop ----------------

export class ShopScene {
  constructor(play) {
    this.play = play;
    this.cursor = 0;
    this.transparentDraw = true;
    this.msg = null;
    this.msgT = 0;
  }

  stock() {
    const st = this.play.state;
    const items = [];
    if (!st.items.includes('bottle') && !st.bottlePotion) {
      items.push({ id: 'bottle', name: 'EMPTY BOTTLE', price: 40 });
    }
    if ((st.items.includes('bottle') || st.bottlePotion === false) && st.items.includes('bottle')) {
      items.push({ id: 'potion', name: 'CRIMSON POTION', price: 30, disabled: st.bottlePotion });
    }
    if (!st.items.includes('bow')) items.push({ id: 'bow', name: 'SYLVAN BOW', price: 80 });
    if (st.items.includes('bow')) items.push({ id: 'arrows', name: 'ARROWS x10', price: 15 });
    if (st.items.includes('bombs')) items.push({ id: 'bombs', name: 'BOMBS x5', price: 20 });
    items.push({ id: 'heart', name: 'FRESH HEART', price: 5 });
    return items;
  }

  update(game) {
    const input = game.input;
    if (this.msgT > 0) { this.msgT--; return; }
    const stock = this.stock();
    if (input.justPressed('pause') || input.justPressed('b')) {
      game.pop();
      sfx('cursor');
      return;
    }
    if (input.justPressed('up')) { this.cursor = (this.cursor + stock.length - 1) % stock.length; sfx('cursor'); }
    if (input.justPressed('down')) { this.cursor = (this.cursor + 1) % stock.length; sfx('cursor'); }
    if (input.justPressed('a') || input.justPressed('interact')) {
      this.buy(stock[this.cursor]);
    }
  }

  buy(item) {
    const st = this.play.state;
    if (!item || item.disabled) { sfx('denied'); return; }
    if (st.gems < item.price) {
      this.msg = 'NOT ENOUGH GEMS, FRIEND.';
      this.msgT = 50;
      sfx('denied');
      return;
    }
    st.gems -= item.price;
    sfx('gem');
    switch (item.id) {
      case 'bottle':
        this.play.acquireItem('bottle');
        break;
      case 'potion':
        st.bottlePotion = true;
        this.msg = 'BOTTLED AND BRIMMING!';
        break;
      case 'bow':
        this.play.acquireItem('bow');
        this.play.setFlag('bow_bought');
        break;
      case 'arrows':
        st.arrows = Math.min(st.arrowsMax, st.arrows + 10);
        this.msg = 'QUIVER TOPPED UP!';
        break;
      case 'bombs':
        st.bombs = Math.min(st.bombsMax, st.bombs + 5);
        this.msg = 'HANDLE WITH CARE!';
        break;
      case 'heart':
        this.play.player.heal(1);
        this.msg = 'FRESH FROM THE GARDEN!';
        break;
    }
    this.msgT = this.msg ? 45 : 0;
  }

  draw(game, ctx) {
    const st = this.play.state;
    const stock = this.stock();
    if (this.cursor >= stock.length) this.cursor = stock.length - 1;
    const h = 60 + stock.length * 12;
    const y0 = (VIEW_H - h) / 2;
    ctx.fillStyle = 'rgba(8,8,22,0.95)';
    ctx.fillRect(50, y0, VIEW_W - 100, h);
    ctx.strokeStyle = '#d8c878';
    ctx.strokeRect(51.5, y0 + 1.5, VIEW_W - 103, h - 3);
    drawTextCentered(ctx, 'MARLO\'S GOODS', VIEW_W / 2, y0 + 8, '#f0d048');
    drawTextCentered(ctx, `YOUR GEMS: ${st.gems}`, VIEW_W / 2, y0 + 20, '#8ef0a0');

    stock.forEach((item, i) => {
      const y = y0 + 36 + i * 12;
      const sel = i === this.cursor;
      if (sel) drawText(ctx, '>', 58, y, '#f0d048');
      const color = item.disabled ? '#50585f' : sel ? '#f8f8f8' : '#9098a0';
      drawText(ctx, item.name, 68, y, color);
      drawText(ctx, `${item.price}`, VIEW_W - 90, y, color);
    });

    drawTextCentered(ctx, this.msgT > 0 ? this.msg : 'A: BUY   B: LEAVE', VIEW_W / 2, y0 + h - 14, this.msgT > 0 ? '#f0d048' : '#9098a0');
  }
}
