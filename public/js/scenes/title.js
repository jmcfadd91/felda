// Title screen. The first keypress also unlocks the AudioContext.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawTextCentered, drawText } from '../ui/textrender.js';
import { getTileset, TILE } from '../gfx/tiles.js';
import { getSprite } from '../gfx/sprites.js';
import { audio } from '../audio/audio.js';
import { sfx } from '../audio/sfx.js';

export class TitleScene {
  constructor() {
    this.t = 0;
    this.started = false;
  }

  enter() {
    audio.playSong('title');
  }

  update(game) {
    this.t++;
    if (game.input.anyKey) {
      audio.unlock();
      if (!this.started) {
        this.started = true;
      } else return;
      sfx('select');
      import('./fileselect.js').then(({ FileSelectScene }) => {
        game.replace(new FileSelectScene());
      });
    }
  }

  draw(game, ctx) {
    // night sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#0c0a24');
    grad.addColorStop(0.6, '#241c48');
    grad.addColorStop(1, '#3c2c5c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // stars
    for (let i = 0; i < 60; i++) {
      const x = (i * 53) % VIEW_W;
      const y = (i * 37) % 130;
      const tw = (this.t / 20 + i) % 6 < 3;
      ctx.fillStyle = tw ? '#9090c0' : '#50507a';
      ctx.fillRect(x, y, 1, 1);
    }

    // moon
    ctx.fillStyle = '#e8e0c0';
    ctx.beginPath();
    ctx.arc(260, 44, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d0c8a8';
    ctx.fillRect(254, 38, 4, 4);
    ctx.fillRect(264, 48, 5, 3);

    // rolling hills silhouette
    ctx.fillStyle = '#181430';
    ctx.beginPath();
    ctx.moveTo(0, 190);
    for (let x = 0; x <= VIEW_W; x += 8) {
      ctx.lineTo(x, 182 + Math.sin(x / 40) * 9);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.lineTo(0, VIEW_H);
    ctx.fill();

    // grass field bottom
    const set = getTileset('overworld');
    for (let x = 0; x < VIEW_W; x += TILE) {
      ctx.globalAlpha = 0.35;
      ctx.drawImage(set.floor.strip, 0, 0, TILE, TILE, x, VIEW_H - 24, TILE, TILE);
      ctx.drawImage(set.floor.strip, TILE, 0, TILE, TILE, x, VIEW_H - 12, TILE, TILE);
      ctx.globalAlpha = 1;
    }

    // hero silhouette
    ctx.drawImage(getSprite('hero_up_0'), 152, VIEW_H - 44);

    // title
    const bob = Math.sin(this.t / 40) * 2;
    drawTextCentered(ctx, 'F E L D A', VIEW_W / 2 + 1, 71 + bob, '#403010');
    drawTextCentered(ctx, 'F E L D A', VIEW_W / 2, 70 + bob, '#f0d048');
    drawTextCentered(ctx, '~ WHISTLE OF ERAS ~', VIEW_W / 2, 90 + bob, '#b0a8f0');

    if ((this.t / 30 | 0) % 2 === 0) {
      drawTextCentered(ctx, 'PRESS ANY KEY', VIEW_W / 2, 150, '#f8f8f8');
    }
    drawTextCentered(ctx, 'ARROWS/WASD MOVE  J/Z SWORD  K/X ITEM', VIEW_W / 2, VIEW_H - 38, '#707090');
    drawTextCentered(ctx, 'E TALK  ESC MENU', VIEW_W / 2, VIEW_H - 28, '#707090');
  }
}
