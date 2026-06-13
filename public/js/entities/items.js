// B-button item behaviors and their projectile entities: Galewing (boomerang),
// bombs, Grapple Fang (hookshot), bow, potion bottle, and the whistle.

import { Entity } from '../engine/entity.js';
import { aabbOverlap } from '../engine/physics.js';
import { TILE } from '../gfx/tiles.js';
import { drawSprite, getSprite } from '../gfx/sprites.js';
import { COLORS as C } from '../gfx/palette.js';
import { sfx } from '../audio/sfx.js';

const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function useItem(item, player, play) {
  switch (item) {
    case 'galewing': {
      if (play.entities.some(e => e instanceof Galewing)) return;
      play.spawn(new Galewing(player, play));
      sfx('boomerang');
      break;
    }
    case 'bombs': {
      if (play.state.bombs <= 0) return sfx('denied');
      play.state.bombs--;
      const [dx, dy] = DIR_VEC[player.dir];
      play.spawn(new Bomb(player.cx + dx * 14 - 6, player.cy + dy * 14 - 6));
      sfx('bombFuse');
      break;
    }
    case 'grapple': {
      if (play.entities.some(e => e instanceof Grapple)) return;
      play.spawn(new Grapple(player, play));
      player.itemLock = 9999; // released by the grapple itself
      sfx('hookshot');
      break;
    }
    case 'bow': {
      if (play.state.arrows <= 0) return sfx('denied');
      play.state.arrows--;
      play.spawn(new Arrow(player));
      player.itemLock = 12;
      sfx('arrow');
      break;
    }
    case 'bottle': {
      if (!play.state.bottlePotion) return sfx('denied');
      play.state.bottlePotion = false;
      player.heal(99);
      play.particles.spawn('heartburst', player.cx, player.cy, 10);
      sfx('heart');
      break;
    }
    case 'whistle': {
      play.openWhistle();
      break;
    }
  }
}

// ---------------- Galewing (boomerang) ----------------
export class Galewing extends Entity {
  constructor(player, play) {
    super(player.cx - 4, player.cy - 4, 8, 8);
    this.player = player;
    const [dx, dy] = DIR_VEC[player.dir];
    this.vx = dx * 3.2;
    this.vy = dy * 3.2;
    this.returning = false;
    this.range = 5.5 * TILE;
    this.travelled = 0;
    this.carrying = null; // pickup entity being fetched
    this.spinT = 0;
    this.canCross = true;
  }

  update(play) {
    this.spinT++;
    // flame relay: passing a lit torch ignites the Galewing, which can then
    // light unlit torches (the Verdant Hollow dark rooms depend on this)
    for (const e of play.entities) {
      if (!e.isTorch || e.dead || !aabbOverlap(this.box, e.box)) continue;
      if (e.lit) this.flaming = true;
      else if (this.flaming) e.light(play);
    }
    if (this.flaming && this.spinT % 4 === 0) {
      play.particles.spawn('ember', this.cx, this.cy, 1);
    }
    if (!this.returning) {
      this.x += this.vx;
      this.y += this.vy;
      this.travelled += Math.hypot(this.vx, this.vy);
      // stun enemies / cut bushes / flip switches along the path
      play.boomerangTouch(this.box);
      const tx = Math.floor(this.cx / TILE);
      const ty = Math.floor(this.cy / TILE);
      const f = play.map.flagsAt(tx, ty);
      if (f.cuttable) {
        play.cutBushAt(tx, ty);
      } else if (f.solid) {
        this.returning = true;
        sfx('clink');
      }
      if (this.travelled >= this.range) this.returning = true;
      // grab pickups
      for (const e of play.entities) {
        if (e.isPickup && !e.dead && aabbOverlap(this.box, e.box)) {
          this.carrying = e;
          e.carried = true;
          this.returning = true;
          break;
        }
      }
    } else {
      const dx = this.player.cx - this.cx;
      const dy = this.player.cy - this.cy;
      const len = Math.hypot(dx, dy) || 1;
      this.x += (dx / len) * 3.6;
      this.y += (dy / len) * 3.6;
      play.boomerangTouch(this.box);
      if (this.carrying) {
        this.carrying.x = this.x;
        this.carrying.y = this.y;
      }
      if (len < 8) {
        if (this.carrying) this.carrying.carried = false;
        this.dead = true;
      }
    }
  }

  draw(ctx, cam) {
    const ang = Math.floor(this.spinT / 3) % 4;
    ctx.save();
    ctx.translate(Math.round(this.cx - cam.x), Math.round(this.cy - cam.y));
    ctx.rotate(ang * Math.PI / 2);
    ctx.fillStyle = C.cream;
    ctx.fillRect(-4, -1, 8, 2);
    ctx.fillRect(-1, -4, 2, 8);
    ctx.fillStyle = C.tan;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
}

// ---------------- Bomb ----------------
export class Bomb extends Entity {
  constructor(x, y) {
    super(x, y, 12, 12);
    this.fuse = 90;
    this.exploded = 0;
    this.canCross = true;
  }

  update(play) {
    if (this.exploded > 0) {
      this.exploded--;
      if (this.exploded === 0) this.dead = true;
      return;
    }
    this.fuse--;
    if (this.fuse % 20 === 0) sfx('bombFuse');
    if (this.fuse <= 0) this.explode(play);
  }

  explode(play) {
    this.exploded = 14;
    sfx('bombBoom');
    play.camera.shake(12, 3);
    play.particles.spawn('boom', this.cx, this.cy, 18);
    play.particles.spawn('smoke', this.cx, this.cy, 10);
    const blast = { x: this.cx - 24, y: this.cy - 24, w: 48, h: 48 };
    // damage enemies & player
    play.hitWithBlast(blast, 2);
    // crack open bombable tiles
    const tx0 = Math.floor(blast.x / TILE);
    const ty0 = Math.floor(blast.y / TILE);
    for (let ty = ty0; ty <= ty0 + 3; ty++) {
      for (let tx = tx0; tx <= tx0 + 3; tx++) {
        if (play.map.flagsAt(tx, ty).bombable) {
          play.bombWallAt(tx, ty);
        }
      }
    }
  }

  draw(ctx, cam) {
    if (this.exploded > 0) {
      const r = 24 - this.exploded;
      ctx.fillStyle = this.exploded % 2 ? C.yellow : C.orange;
      ctx.beginPath();
      ctx.arc(Math.round(this.cx - cam.x), Math.round(this.cy - cam.y), r, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (this.fuse < 30 && this.fuse % 6 < 3) {
      ctx.fillStyle = C.red;
      ctx.fillRect(Math.round(this.x - cam.x), Math.round(this.y - cam.y), this.w, this.h);
      return;
    }
    this.drawSpriteAnchored(ctx, cam, 'bomb_pickup', { yOff: 2 });
  }
}

// ---------------- Arrow ----------------
export class Arrow extends Entity {
  constructor(player) {
    super(player.cx - 2, player.cy - 2, 4, 4);
    this.dir = player.dir;
    const [dx, dy] = DIR_VEC[player.dir];
    this.vx = dx * 4;
    this.vy = dy * 4;
    this.life = 70;
    this.canCross = true;
  }

  update(play) {
    this.x += this.vx;
    this.y += this.vy;
    if (--this.life <= 0) this.dead = true;
    const tx = Math.floor(this.cx / TILE);
    const ty = Math.floor(this.cy / TILE);
    if (play.map.flagsAt(tx, ty).solid) {
      this.dead = true;
      sfx('clink');
      play.particles.spawn('stone', this.cx, this.cy, 3);
      return;
    }
    if (play.arrowTouch(this.box, 1)) this.dead = true;
  }

  draw(ctx, cam) {
    ctx.fillStyle = C.brown;
    const x = Math.round(this.cx - cam.x);
    const y = Math.round(this.cy - cam.y);
    if (this.dir === 'up' || this.dir === 'down') {
      ctx.fillRect(x - 1, y - 4, 2, 8);
      ctx.fillStyle = C.white;
      ctx.fillRect(x - 1, this.dir === 'up' ? y - 5 : y + 3, 2, 2);
    } else {
      ctx.fillRect(x - 4, y - 1, 8, 2);
      ctx.fillStyle = C.white;
      ctx.fillRect(this.dir === 'left' ? x - 5 : x + 3, y - 1, 2, 2);
    }
  }
}

// ---------------- Grapple Fang (hookshot) ----------------
export class Grapple extends Entity {
  constructor(player, play) {
    super(player.cx - 3, player.cy - 3, 6, 6);
    this.player = player;
    this.dir = player.dir;
    const [dx, dy] = DIR_VEC[player.dir];
    this.dx = dx;
    this.dy = dy;
    this.phase = 'out'; // out | retract | pull
    this.range = 6.5 * TILE;
    this.travelled = 0;
    this.canCross = true;
  }

  release() {
    this.dead = true;
    this.player.itemLock = 0;
  }

  update(play) {
    const SPEED = 5;
    if (this.phase === 'out') {
      this.x += this.dx * SPEED;
      this.y += this.dy * SPEED;
      this.travelled += SPEED;
      // hit enemies: stun + retract
      if (play.boomerangTouch(this.box)) {
        this.phase = 'retract';
        return;
      }
      const tx = Math.floor(this.cx / TILE);
      const ty = Math.floor(this.cy / TILE);
      const f = play.map.flagsAt(tx, ty);
      if (f.hookable) {
        this.phase = 'pull';
        this.anchorX = tx * TILE + TILE / 2;
        this.anchorY = ty * TILE + TILE / 2;
        sfx('hookshot');
        return;
      }
      if (f.solid) {
        this.phase = 'retract';
        sfx('clink');
        return;
      }
      if (this.travelled >= this.range) this.phase = 'retract';
    } else if (this.phase === 'retract') {
      const dx = this.player.cx - this.cx;
      const dy = this.player.cy - this.cy;
      const len = Math.hypot(dx, dy) || 1;
      this.x += (dx / len) * 7;
      this.y += (dy / len) * 7;
      if (len < 10) this.release();
    } else if (this.phase === 'pull') {
      // drag the player to the anchor, flying over pits/water
      const p = this.player;
      const dx = this.anchorX - p.cx;
      const dy = this.anchorY - p.cy;
      const len = Math.hypot(dx, dy);
      if (len < 14) {
        p.rememberSafeSpot();
        this.release();
        return;
      }
      p.x += (dx / len) * 4;
      p.y += (dy / len) * 4;
    }
  }

  draw(ctx, cam) {
    // chain
    const px = this.player.cx - cam.x;
    const py = this.player.cy - cam.y;
    const hx = this.cx - cam.x;
    const hy = this.cy - cam.y;
    const segs = Math.floor(Math.hypot(hx - px, hy - py) / 6);
    ctx.fillStyle = C.gray;
    for (let i = 1; i <= segs; i++) {
      const t = i / (segs + 1);
      ctx.fillRect(Math.round(px + (hx - px) * t) - 1, Math.round(py + (hy - py) * t) - 1, 2, 2);
    }
    // fang head
    ctx.fillStyle = C.stoneLight;
    ctx.fillRect(Math.round(hx) - 3, Math.round(hy) - 3, 6, 6);
    ctx.fillStyle = C.grayDark;
    ctx.fillRect(Math.round(hx) - 1, Math.round(hy) - 1, 2, 2);
  }
}
