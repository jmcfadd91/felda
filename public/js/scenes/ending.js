// Victory: a short epilogue crawl and credits.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawTextCentered } from '../ui/textrender.js';
import { audio } from '../audio/audio.js';
import { persist } from '../engine/save.js';

const LINES = [
  '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
  'The Sleepless King sleeps.',
  '',
  'Deep beneath Castle Nocturne,',
  'the Sleeping Dark turned over once,',
  'sighed, and dreamed of nothing at all.',
  '',
  'The three relics returned to their shrines.',
  'The sky remembered its colors.',
  '',
  'Princess Liora kept her promise:',
  'there was a festival,',
  'and the hero did not get to skip it.',
  '',
  'Elder Rowan planted a fourth shrine',
  'in Bramblewick, for a guardian',
  'who needed no relic at all.',
  '',
  'And if some nights a whistle drifts',
  'over Heartfield, four notes and gone -',
  '',
  'that is only the wind,',
  'practicing its favorite song.',
  '',
  '', '',
  '* FELDA: WHISTLE OF ERAS *',
  '',
  'THANK YOU FOR PLAYING',
  '',
  'Your save remembers everything.',
  'The kingdom is yours to wander.',
  '',
  'PRESS A TO RETURN',
];

export class EndingScene {
  constructor(play) {
    this.play = play;
    this.t = 0;
    audio.playSong('ending');
  }

  update(game) {
    this.t++;
    const maxScroll = LINES.length * 14;
    if (this.t / 2 >= maxScroll - 100 && (game.input.justPressed('a') || game.input.justPressed('interact'))) {
      this.play.setFlag('vhorrun_defeated');
      this.play.state.duskfall = false;
      this.play.state.checkpoint = { map: 'town', x: 14 * 16, y: 16 * 16 };
      persist(this.play.slot, this.play.state);
      import('./title.js').then(({ TitleScene }) => game.replace(new TitleScene()));
    }
  }

  draw(game, ctx) {
    ctx.fillStyle = '#06060f';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // starfield
    for (let i = 0; i < 40; i++) {
      const x = (i * 67) % VIEW_W;
      const y = (i * 41 + Math.floor(this.t / 8)) % VIEW_H;
      ctx.fillStyle = i % 3 ? '#2a2a4a' : '#4a4a7a';
      ctx.fillRect(x, y, 1, 1);
    }
    const scroll = Math.min(this.t / 2, LINES.length * 14 - 100);
    LINES.forEach((line, i) => {
      const y = VIEW_H + i * 14 - scroll;
      if (y < -10 || y > VIEW_H + 10) return;
      const gold = line.startsWith('*') || line === 'THANK YOU FOR PLAYING';
      drawTextCentered(ctx, line.replace(/\*/g, '').trim(), VIEW_W / 2, y, gold ? '#f0d048' : '#d8d8e8');
    });
  }
}
