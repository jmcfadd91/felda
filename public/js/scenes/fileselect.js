// File select: optional account login/register (saves sync to the server)
// plus three save slots. Works fully offline on localStorage if the server
// is unreachable.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawText, drawTextCentered } from '../ui/textrender.js';
import { drawHeart } from '../ui/hud.js';
import {
  session, checkLogin, api, listSlots, loadSlot, deleteSlot,
  newGameState, deserialize, persist,
} from '../engine/save.js';
import { sfx } from '../audio/sfx.js';
import { audio } from '../audio/audio.js';
import { Input } from '../engine/input.js';

export class FileSelectScene {
  constructor() {
    this.mode = 'loading'; // loading | menu | auth | slots | confirm
    this.cursor = 0;
    this.slots = [null, null, null];
    this.authMode = 'login';
    this.fields = { username: '', password: '' };
    this.field = 0;
    this.error = null;
    this.busy = false;
    this._keyHandler = null;
  }

  enter(game) {
    this.game = game;
    audio.playSong('fairy');
    checkLogin().then(() => {
      if (session.username) this._toSlots();
      else { this.mode = 'menu'; this.cursor = 0; }
    });
    this._keyHandler = (e) => this._onKey(e);
    addEventListener('keydown', this._keyHandler);
  }

  exit() {
    removeEventListener('keydown', this._keyHandler);
    Input.textCapture = false;
  }

  async _toSlots() {
    Input.textCapture = false;
    this.mode = 'loading';
    this.slots = await listSlots();
    this.mode = 'slots';
    this.cursor = 0;
  }

  _onKey(e) {
    if (this.mode !== 'auth' || this.busy) return;
    const f = this.field === 0 ? 'username' : 'password';
    if (e.key === 'Backspace') {
      this.fields[f] = this.fields[f].slice(0, -1);
      e.preventDefault();
    } else if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      this.field = 1 - this.field;
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (this.field === 0 && this.fields.username) this.field = 1;
      else if (this.fields.username && this.fields.password) this._submitAuth();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.mode = 'menu';
      Input.textCapture = false;
      sfx('cursor');
      e.preventDefault();
    } else if (e.key.length === 1 && /[\x20-\x7e]/.test(e.key)) {
      const max = f === 'username' ? 20 : 64;
      if (this.fields[f].length < max) this.fields[f] += e.key;
      e.preventDefault();
    }
  }

  async _submitAuth() {
    if (this.busy) return;
    this.busy = true;
    this.error = null;
    try {
      const r = await api(this.authMode === 'login' ? 'login' : 'register', {
        body: { username: this.fields.username, password: this.fields.password },
      });
      if (r.ok) {
        session.username = r.data.username;
        sfx('secret');
        await this._toSlots();
      } else {
        this.error = r.data?.error || 'Something went wrong.';
        sfx('denied');
      }
    } catch {
      this.error = 'Server unreachable. You can play offline.';
      sfx('denied');
    }
    this.busy = false;
  }

  async _startSlot(slot) {
    sfx('fanfare');
    let state = await loadSlot(slot);
    if (!state) {
      state = newGameState();
      persist(slot, state);
    }
    const { PlayScene } = await import('./play.js');
    this.game.replace(new PlayScene(state, slot));
  }

  update(game) {
    const input = game.input;
    if (this.mode === 'loading' || this.busy) return;

    if (this.mode === 'menu') {
      const opts = 3;
      if (input.justPressed('up')) { this.cursor = (this.cursor + opts - 1) % opts; sfx('cursor'); }
      if (input.justPressed('down')) { this.cursor = (this.cursor + 1) % opts; sfx('cursor'); }
      if (input.justPressed('a') || input.justPressed('interact')) {
        sfx('select');
        if (this.cursor === 0) this._toSlots();
        else {
          this.authMode = this.cursor === 1 ? 'login' : 'register';
          this.mode = 'auth';
          this.fields = { username: '', password: '' };
          this.field = 0;
          this.error = null;
          Input.textCapture = true;
        }
      }
      return;
    }

    if (this.mode === 'auth') return; // handled by raw key capture

    if (this.mode === 'slots') {
      if (input.justPressed('up')) { this.cursor = (this.cursor + 2) % 3; sfx('cursor'); }
      if (input.justPressed('down')) { this.cursor = (this.cursor + 1) % 3; sfx('cursor'); }
      if (input.justPressed('a') || input.justPressed('interact')) {
        this._startSlot(this.cursor + 1);
      }
      if (input.justPressed('b') && this.slots[this.cursor]) {
        this.mode = 'confirm';
        sfx('denied');
      }
      if (input.justPressed('pause')) {
        import('./title.js').then(({ TitleScene }) => game.replace(new TitleScene()));
      }
      return;
    }

    if (this.mode === 'confirm') {
      if (input.justPressed('b') || input.justPressed('pause')) {
        this.mode = 'slots';
        sfx('cursor');
      }
      if (input.justPressed('a') || input.justPressed('interact')) {
        deleteSlot(this.cursor + 1).then(() => this._toSlots());
        sfx('bombBoom');
      }
    }
  }

  draw(game, ctx) {
    ctx.fillStyle = '#10122a';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i % 3 ? '#222448' : '#34366a';
      ctx.fillRect((i * 83) % VIEW_W, (i * 59) % VIEW_H, 1, 1);
    }
    drawTextCentered(ctx, '- CHOOSE YOUR JOURNEY -', VIEW_W / 2, 18, '#f0d048');

    if (this.mode === 'loading' || this.busy) {
      drawTextCentered(ctx, 'COMMUNING WITH THE SPIRITS...', VIEW_W / 2, 110, '#9098a0');
      return;
    }

    if (this.mode === 'menu') {
      const opts = ['PLAY (LOCAL SAVES)', 'LOG IN', 'CREATE ACCOUNT'];
      opts.forEach((o, i) => {
        const sel = i === this.cursor;
        drawTextCentered(ctx, (sel ? '> ' : '  ') + o, VIEW_W / 2, 90 + i * 18, sel ? '#f8f8f8' : '#9098a0');
      });
      drawTextCentered(ctx, 'AN ACCOUNT KEEPS YOUR SAVES ON THE SERVER', VIEW_W / 2, 170, '#707090');
      drawTextCentered(ctx, 'SO ANY DEVICE CAN CONTINUE YOUR QUEST', VIEW_W / 2, 180, '#707090');
      return;
    }

    if (this.mode === 'auth') {
      drawTextCentered(ctx, this.authMode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT', VIEW_W / 2, 50, '#b0a8f0');
      const fields = [
        ['NAME', this.fields.username, false],
        ['SECRET', '*'.repeat(this.fields.password.length), true],
      ];
      fields.forEach(([label, value, isPw], i) => {
        const y = 84 + i * 30;
        const sel = this.field === i;
        drawText(ctx, label, 70, y, sel ? '#f0d048' : '#9098a0');
        ctx.fillStyle = sel ? '#2a2c52' : '#1c1e3a';
        ctx.fillRect(70, y + 10, 180, 12);
        drawText(ctx, value + (sel && (game.ticks / 20 | 0) % 2 === 0 ? '_' : ''), 73, y + 12, '#f8f8f8');
      });
      if (this.error) {
        const msg = this.error.toUpperCase().slice(0, 48);
        drawTextCentered(ctx, msg.slice(0, 40), VIEW_W / 2, 152, '#f08080');
        if (msg.length > 40) drawTextCentered(ctx, msg.slice(40), VIEW_W / 2, 161, '#f08080');
      }
      drawTextCentered(ctx, 'TYPE TO FILL  TAB: SWITCH  ENTER: SUBMIT', VIEW_W / 2, 186, '#707090');
      drawTextCentered(ctx, this.authMode === 'register' ? 'NAME: 3-20 LETTERS/DIGITS  SECRET: 8+ CHARS' : 'ESC: BACK', VIEW_W / 2, 198, '#707090');
      if (this.authMode === 'register') drawTextCentered(ctx, 'ESC: BACK', VIEW_W / 2, 210, '#707090');
      return;
    }

    // slots
    drawTextCentered(ctx, session.username ? `TRAVELER: ${session.username.toUpperCase()}` : 'LOCAL SAVES (THIS BROWSER ONLY)',
      VIEW_W / 2, 34, '#8ef0a0');
    for (let i = 0; i < 3; i++) {
      const y = 56 + i * 46;
      const sel = this.cursor === i;
      const slot = this.slots[i];
      ctx.fillStyle = sel ? '#262a52' : '#181a36';
      ctx.fillRect(46, y, VIEW_W - 92, 38);
      if (sel) {
        ctx.strokeStyle = '#f0d048';
        ctx.strokeRect(46.5, y + 0.5, VIEW_W - 93, 37);
      }
      drawText(ctx, `SLOT ${i + 1}`, 54, y + 5, sel ? '#f0d048' : '#9098a0');
      if (slot) {
        const s = slot.summary || {};
        drawText(ctx, (s.name || 'RIN').toUpperCase(), 54, y + 18, '#f8f8f8');
        for (let h = 0; h < Math.min(s.hearts || 3, 8); h++) {
          drawHeart(ctx, 110 + h * 9, y + 17, 'full');
        }
        const mins = Math.floor((s.playtime || 0) / 60);
        drawText(ctx, `${Math.floor(mins / 60)}H${String(mins % 60).padStart(2, '0')}M`, 222, y + 18, '#9098a0');
        drawText(ctx, regionName(s.region), 54, y + 28, '#707090');
      } else {
        drawText(ctx, '- NEW QUEST -', 54, y + 20, '#707090');
      }
    }
    if (this.mode === 'confirm') {
      ctx.fillStyle = 'rgba(8,8,20,0.92)';
      ctx.fillRect(60, 90, VIEW_W - 120, 60);
      ctx.strokeStyle = '#f08080';
      ctx.strokeRect(60.5, 90.5, VIEW_W - 121, 59);
      drawTextCentered(ctx, `ERASE SLOT ${this.cursor + 1}?`, VIEW_W / 2, 102, '#f08080');
      drawTextCentered(ctx, 'THIS CANNOT BE UNDONE!', VIEW_W / 2, 116, '#f8f8f8');
      drawTextCentered(ctx, 'A: ERASE   B: KEEP', VIEW_W / 2, 134, '#9098a0');
    } else {
      drawTextCentered(ctx, 'A: PLAY   B/K: ERASE   ESC: BACK', VIEW_W / 2, VIEW_H - 16, '#707090');
    }
  }
}

function regionName(mapId) {
  if (!mapId) return '';
  const names = {
    bramblewick: 'BRAMBLEWICK', heartfield: 'HEARTFIELD', town: 'ELDERMERE',
    scorch: 'SCORCHPEAK', marsh: 'MISTMARSH', lake: 'LAKE LUMEN',
    d1: 'VERDANT HOLLOW', d2: 'CINDER DEPTHS', d3: 'SUNKEN SANCTUM',
    castle: 'CASTLE NOCTURNE', nocturne: 'NOCTURNE APPROACH',
  };
  for (const k of Object.keys(names)) {
    if (mapId.startsWith(k)) return names[k];
  }
  return mapId.replace(/_/g, ' ').toUpperCase().slice(0, 24);
}
