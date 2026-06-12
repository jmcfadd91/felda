// Game over: continue from the last checkpoint or return to the title.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawTextCentered } from '../ui/textrender.js';
import { audio } from '../audio/audio.js';
import { sfx } from '../audio/sfx.js';

export class GameOverScene {
  constructor(play) {
    this.play = play;
    this.t = 0;
    this.cursor = 0;
    audio.playSong('gameover');
  }

  update(game) {
    this.t++;
    if (this.t < 90) return;
    const input = game.input;
    if (input.justPressed('up') || input.justPressed('down')) {
      this.cursor = 1 - this.cursor;
      sfx('cursor');
    }
    if (input.justPressed('a') || input.justPressed('interact')) {
      sfx('select');
      if (this.cursor === 0) {
        // continue from checkpoint
        const state = this.play.state;
        state.hearts = Math.min(3, state.heartsMax);
        import('./play.js').then(({ PlayScene }) => {
          game.replace(new PlayScene(state, this.play.slot));
        });
      } else {
        import('./title.js').then(({ TitleScene }) => {
          game.replace(new TitleScene());
        });
      }
    }
  }

  draw(game, ctx) {
    ctx.fillStyle = '#100408';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const alpha = Math.min(1, this.t / 60);
    ctx.globalAlpha = alpha;
    drawTextCentered(ctx, 'G A M E   O V E R', VIEW_W / 2, 80, '#d04848');
    if (this.t >= 90) {
      drawTextCentered(ctx, (this.cursor === 0 ? '> ' : '  ') + 'CONTINUE', VIEW_W / 2, 130, this.cursor === 0 ? '#f0d048' : '#9098a0');
      drawTextCentered(ctx, (this.cursor === 1 ? '> ' : '  ') + 'TITLE SCREEN', VIEW_W / 2, 146, this.cursor === 1 ? '#f0d048' : '#9098a0');
    }
    ctx.globalAlpha = 1;
  }
}
