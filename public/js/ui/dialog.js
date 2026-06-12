// Letterboxed typewriter dialog scene, pushed on top of Play. Supports
// multiple pages, a speaker name, and an optional two-choice prompt.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawText, wrapText, CHAR_W } from './textrender.js';
import { sfx } from '../audio/sfx.js';

const BOX_H = 56;
const MAX_CHARS = Math.floor((VIEW_W - 24) / CHAR_W);

export class DialogScene {
  // pages: array of strings. opts: {speaker, choices: ['Yes','No'], onDone(choiceIndex)}
  constructor(pages, opts = {}) {
    this.pages = Array.isArray(pages) ? pages : [pages];
    this.speaker = opts.speaker || null;
    this.choices = opts.choices || null;
    this.onDone = opts.onDone || null;
    this.page = 0;
    this.chars = 0;
    this.choice = 0;
    this.transparentDraw = true;
    this._lines = wrapText(this.pages[0], MAX_CHARS);
  }

  get pageText() { return this.pages[this.page]; }
  get fullLength() { return this._lines.join(' ').length; }
  get done() { return this.chars >= this.fullLength; }
  get lastPage() { return this.page === this.pages.length - 1; }

  update(game) {
    const input = game.input;
    if (!this.done) {
      this.chars += input.held('a') || input.held('interact') ? 3 : 1.4;
      if (Math.floor(this.chars) % 3 === 0) sfx('text');
      if (this.done && this.lastPage && this.choices) this.choice = 0;
      return;
    }
    if (this.lastPage && this.choices) {
      if (input.justPressed('up') || input.justPressed('down') ||
          input.justPressed('left') || input.justPressed('right')) {
        this.choice = 1 - this.choice;
        sfx('cursor');
      }
      if (input.justPressed('a') || input.justPressed('interact')) {
        game.pop();
        sfx('select');
        this.onDone?.(this.choice);
      }
      return;
    }
    if (input.justPressed('a') || input.justPressed('interact')) {
      if (this.lastPage) {
        game.pop();
        this.onDone?.(null);
      } else {
        this.page++;
        this.chars = 0;
        this._lines = wrapText(this.pages[this.page], MAX_CHARS);
        sfx('cursor');
      }
    }
  }

  draw(game, ctx) {
    const y0 = VIEW_H - BOX_H - 6;
    ctx.fillStyle = 'rgba(8,8,20,0.92)';
    ctx.fillRect(8, y0, VIEW_W - 16, BOX_H);
    ctx.strokeStyle = '#d8c878';
    ctx.lineWidth = 1;
    ctx.strokeRect(9.5, y0 + 1.5, VIEW_W - 19, BOX_H - 3);

    if (this.speaker) {
      ctx.fillStyle = 'rgba(8,8,20,0.95)';
      ctx.fillRect(14, y0 - 9, this.speaker.length * CHAR_W + 8, 12);
      drawText(ctx, this.speaker, 18, y0 - 7, '#f0d048');
    }

    let remaining = Math.floor(this.chars);
    for (let i = 0; i < Math.min(this._lines.length, 3 + (this.choices && this.lastPage ? 0 : 1)); i++) {
      const line = this._lines[i];
      const show = Math.max(0, Math.min(line.length, remaining));
      remaining -= line.length;
      drawText(ctx, line.slice(0, show), 16, y0 + 8 + i * 11, '#f8f8f8');
    }

    if (this.done) {
      if (this.lastPage && this.choices) {
        const cy = y0 + BOX_H - 13;
        this.choices.forEach((c, idx) => {
          const cx = 40 + idx * 120;
          if (idx === this.choice) drawText(ctx, '>', cx - 10, cy, '#f0d048');
          drawText(ctx, c, cx, cy, idx === this.choice ? '#f0d048' : '#9098a0');
        });
      } else if ((game.ticks / 20 | 0) % 2 === 0) {
        drawText(ctx, 'v', VIEW_W - 26, y0 + BOX_H - 11, '#d8c878');
      }
    }
  }
}
