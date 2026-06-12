// Townsfolk and story characters. Dialogue text lives in story/dialogue.js;
// NPCs look up their lines by id each time they're spoken to.

import { Entity } from '../engine/entity.js';
import { TILE } from '../gfx/tiles.js';
import { dialogueFor } from '../story/dialogue.js';

export class NPC extends Entity {
  constructor(def) {
    super(def.x * TILE + 3, def.y * TILE + 5, 10, 10);
    this.id = def.id;
    this.sprite = def.sprite || 'npc_man';
    this.solid = true;
    this.wander = def.wander ?? true;
    this.home = { x: this.x, y: this.y };
    this.stepT = 0;
    this.moveT = 0;
    this.mv = [0, 0];
    this.faceT = 0;
  }

  interact(play) {
    // face the player
    const dx = play.player.cx - this.cx;
    const dy = play.player.cy - this.cy;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    this.faceT = 90;
    const d = dialogueFor(this.id, play);
    if (d) {
      play.say(d.pages, { speaker: d.speaker, choices: d.choices, onDone: d.onDone });
      return true;
    }
    return false;
  }

  update(play) {
    this.stepT++;
    if (this.faceT > 0) { this.faceT--; return; }
    if (!this.wander) return;
    if (this.moveT > 0) {
      this.moveT--;
      const nx = this.x + this.mv[0] * 0.4;
      const ny = this.y + this.mv[1] * 0.4;
      // stay near home, avoid walls and the player
      if (Math.abs(nx - this.home.x) < 24 && Math.abs(ny - this.home.y) < 24) {
        const tx = Math.floor((nx + this.w / 2) / TILE);
        const ty = Math.floor((ny + this.h / 2) / TILE);
        const f = play.map.flagsAt(tx, ty);
        if (!f.solid && !f.water && !f.lava && !f.pit) {
          this.x = nx;
          this.y = ny;
        }
      }
    } else if (Math.random() < 0.01) {
      this.moveT = 30 + Math.random() * 40;
      const dirs = [[0, 1, 'down'], [0, -1, 'up'], [1, 0, 'right'], [-1, 0, 'left'], [0, 0, this.dir]];
      const d = dirs[Math.floor(Math.random() * dirs.length)];
      this.mv = [d[0], d[1]];
      this.dir = d[2];
    }
  }

  draw(ctx, cam) {
    this.drawShadow(ctx, cam);
    const moving = this.moveT > 0 && (this.mv[0] || this.mv[1]);
    const frame = moving ? Math.floor(this.stepT / 10) % 2 : 0;
    const base = this.dir === 'left' || this.dir === 'right' ? `${this.sprite}_side` : `${this.sprite}_${this.dir}`;
    this.drawSpriteAnchored(ctx, cam, `${base}_${frame}`, { flip: this.dir === 'left' });
  }
}
