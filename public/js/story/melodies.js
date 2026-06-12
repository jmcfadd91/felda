// The Whistle of Eras: a 4-note input overlay. Arrow keys (or d-pad) play
// notes; matching a learned melody triggers its effect on the current map.

import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { drawText, drawTextCentered } from '../ui/textrender.js';
import { sfx } from '../audio/sfx.js';
import { audio } from '../audio/audio.js';

export const MELODIES = {
  rousing: { name: 'Song of Rousing', notes: ['up', 'left', 'right', 'up'] },
  ember: { name: 'Ember Round', notes: ['down', 'right', 'right', 'down'] },
  tide: { name: 'Tidewalker\'s Air', notes: ['left', 'up', 'down', 'left'] },
  lament: { name: 'Liora\'s Lament', notes: ['up', 'down', 'up', 'down'] },
};

const NOTE_IDX = { up: 0, left: 1, right: 2, down: 3 };
const ARROWS = { up: '+', left: '<', right: '>', down: 'v' };

export class WhistleScene {
  constructor(play) {
    this.play = play;
    this.notes = [];
    this.resultT = 0;
    this.matched = null;
    this.transparentDraw = true;
    audio.stopSong();
  }

  update(game) {
    if (this.resultT > 0) {
      this.resultT--;
      if (this.resultT === 0) {
        game.pop();
        if (this.matched) applyMelody(this.play, this.matched);
      }
      return;
    }
    const input = game.input;
    if (input.justPressed('pause') || input.justPressed('b')) {
      game.pop();
      this.play.resumeMusic();
      return;
    }
    for (const dir of ['up', 'down', 'left', 'right']) {
      if (input.justPressed(dir)) {
        this.notes.push(dir);
        sfx('whistleNote', NOTE_IDX[dir]);
        if (this.notes.length === 4) {
          const learned = this.play.state.melodies;
          this.matched = Object.keys(MELODIES).find(id =>
            learned.includes(id) &&
            MELODIES[id].notes.every((n, i) => this.notes[i] === n)) || null;
          this.resultT = this.matched ? 60 : 40;
          if (this.matched) sfx('melodyOk');
          else setTimeout(() => sfx('denied'), 250);
        }
        break;
      }
    }
  }

  draw(game, ctx) {
    const y0 = VIEW_H - 70;
    ctx.fillStyle = 'rgba(8,8,20,0.92)';
    ctx.fillRect(40, y0, VIEW_W - 80, 58);
    ctx.strokeStyle = '#d8c878';
    ctx.strokeRect(41.5, y0 + 1.5, VIEW_W - 83, 55);
    drawTextCentered(ctx, 'WHISTLE OF ERAS', VIEW_W / 2, y0 + 6, '#f0d048');
    if (this.resultT > 0 && this.matched) {
      drawTextCentered(ctx, MELODIES[this.matched].name, VIEW_W / 2, y0 + 24, '#8ef0a0');
    } else if (this.resultT > 0) {
      drawTextCentered(ctx, '. . . nothing stirs . . .', VIEW_W / 2, y0 + 24, '#9098a0');
    } else {
      // note slots
      for (let i = 0; i < 4; i++) {
        const x = VIEW_W / 2 - 40 + i * 22;
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x, y0 + 20, 16, 16);
        if (this.notes[i]) {
          drawText(ctx, ARROWS[this.notes[i]], x + 5, y0 + 24, '#f8f8f8');
        }
      }
      drawTextCentered(ctx, 'PLAY 4 NOTES   B: CLOSE', VIEW_W / 2, y0 + 44, '#9098a0');
    }
  }
}

function applyMelody(play, id) {
  const hook = play.mapDef.melodies?.[id];
  if (hook) {
    hook(play);
    play.resumeMusic();
    return;
  }
  if (id === 'lament') {
    // warp home to Eldermere from anywhere outdoors
    if (play.mapDef.outdoor || play.mapDef.warpable) {
      play.particles.spawn('sparkle', play.player.cx, play.player.cy, 16);
      play.changeMap('town', 14, 16);
      return;
    }
    play.say('The lament echoes strangely here. The walls swallow it.');
    play.resumeMusic();
    return;
  }
  play.particles.spawn('sparkle', play.player.cx, play.player.cy, 8);
  play.resumeMusic();
}
