// The eight enemy types, each a small state machine on a shared base.

import { Entity } from '../engine/entity.js';
import { moveEntity, aabbOverlap, tileUnder } from '../engine/physics.js';
import { TILE } from '../gfx/tiles.js';
import { COLORS as C } from '../gfx/palette.js';
import { sfx } from '../audio/sfx.js';

export class Enemy extends Entity {
  constructor(def, w = 12, h = 12) {
    super(def.x * TILE + (TILE - w) / 2, def.y * TILE + (TILE - h) / 2, w, h);
    this.isEnemy = true;
    this.stunned = 0;
    this.hurtsPlayer = 1;
    this.animT = 0;
    this.thinkT = Math.floor(Math.random() * 60);
  }

  baseEnemyTick(play) {
    this.baseTick();
    this.animT++;
    if (this.stunned > 0) {
      this.stunned--;
      return false; // skip AI
    }
    if (this.knocked) {
      moveEntity(this, play.map, this.knockX, this.knockY);
      return false;
    }
    return true;
  }

  die() { this.dead = true; }

  // walk toward a point, returns true if blocked
  seek(play, x, y, speed) {
    const dx = x - this.cx;
    const dy = y - this.cy;
    const len = Math.hypot(dx, dy) || 1;
    const r = moveEntity(this, play.map, (dx / len) * speed, (dy / len) * speed);
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    return r.hitX || r.hitY;
  }

  drawFrames(ctx, cam, base, rate = 12) {
    if (!this.visible) return;
    this.drawShadow(ctx, cam);
    const frame = Math.floor(this.animT / rate) % 2;
    const opts = { flip: this.dir === 'left' };
    if (this.stunned > 0 && this.animT % 8 < 4) opts.yOff = -1;
    this.drawSpriteAnchored(ctx, cam, `${base}_${frame}`, opts);
    if (this.stunned > 0) {
      // dizzy stars
      ctx.fillStyle = C.yellow;
      const a = this.animT / 5;
      ctx.fillRect(Math.round(this.cx + Math.cos(a) * 7 - cam.x), Math.round(this.y - 6 + Math.sin(a) * 2 - cam.y), 2, 2);
      ctx.fillRect(Math.round(this.cx + Math.cos(a + 3) * 7 - cam.x), Math.round(this.y - 6 + Math.sin(a + 3) * 2 - cam.y), 2, 2);
    }
  }
}

// ---------------- Thornling: wanders, charges when aligned ----------------
export class Thornling extends Enemy {
  constructor(def) {
    super(def);
    this.hp = this.maxHp = 2;
    this.state = 'wander';
    this.mv = [0, 0];
  }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    const p = play.player;
    if (this.state === 'wander') {
      if (--this.thinkT <= 0) {
        this.thinkT = 40 + Math.random() * 50;
        const dirs = [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [0, 0]];
        this.mv = dirs[Math.floor(Math.random() * dirs.length)];
        if (this.mv[0]) this.dir = this.mv[0] > 0 ? 'right' : 'left';
        else if (this.mv[1]) this.dir = this.mv[1] > 0 ? 'down' : 'up';
      }
      moveEntity(this, play.map, this.mv[0], this.mv[1]);
      // spot the player along an axis
      if (Math.abs(p.cy - this.cy) < 8 && Math.abs(p.cx - this.cx) < 7 * TILE) {
        this.state = 'charge';
        this.mv = [Math.sign(p.cx - this.cx) * 2.2, 0];
        this.dir = this.mv[0] > 0 ? 'right' : 'left';
        sfx('cursor');
      } else if (Math.abs(p.cx - this.cx) < 8 && Math.abs(p.cy - this.cy) < 7 * TILE) {
        this.state = 'charge';
        this.mv = [0, Math.sign(p.cy - this.cy) * 2.2];
        this.dir = this.mv[1] > 0 ? 'down' : 'up';
        sfx('cursor');
      }
    } else {
      const r = moveEntity(this, play.map, this.mv[0], this.mv[1]);
      if (r.hitX || r.hitY) {
        this.state = 'wander';
        this.thinkT = 30;
        this.mv = [0, 0];
        play.camera.shake(4, 1.5);
      }
    }
  }

  draw(ctx, cam) { this.drawFrames(ctx, cam, 'thornling', this.state === 'charge' ? 5 : 12); }
}

// ---------------- Pricklepod: armored front ----------------
export class Pricklepod extends Enemy {
  constructor(def) {
    super(def);
    this.hp = this.maxHp = 3;
    this.speed = 0.35;
  }

  swordImmune(player) {
    // immune unless struck from behind (player is behind my facing)
    const facing = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    const dot = dx * facing[0] + dy * facing[1];
    return dot > -2; // hit from front/side: blocked
  }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    if (--this.thinkT <= 0) {
      this.thinkT = 20;
    }
    this.seek(play, play.player.cx, play.player.cy, this.speed);
  }

  draw(ctx, cam) { this.drawFrames(ctx, cam, 'pricklepod', 16); }
}

// ---------------- Gloomwisp: drifts through walls ----------------
export class Gloomwisp extends Enemy {
  constructor(def) {
    super(def, 10, 10);
    this.hp = this.maxHp = 1;
    this.t = Math.random() * 100;
    this.canCross = true;
  }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    this.t += 0.05;
    const p = play.player;
    const dx = p.cx - this.cx;
    const dy = p.cy - this.cy;
    const len = Math.hypot(dx, dy) || 1;
    // float straight through everything
    this.x += (dx / len) * 0.55 + Math.cos(this.t) * 0.4;
    this.y += (dy / len) * 0.55 + Math.sin(this.t * 1.3) * 0.4;
  }

  draw(ctx, cam) {
    if (!this.visible) return;
    const frame = Math.floor(this.animT / 10) % 2;
    this.drawSpriteAnchored(ctx, cam, `gloomwisp_${frame}`, { yOff: Math.round(Math.sin(this.t * 2) * 2) });
  }
}

// ---------------- Emberkin: lava hopper, lobs fire ----------------
export class Emberkin extends Enemy {
  constructor(def) {
    super(def);
    this.hp = this.maxHp = 2;
    this.canCross = true; // stands on lava
    this.hopT = 0;
  }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    if (this.hopT > 0) {
      this.hopT--;
      moveEntity(this, play.map, this.mvx, this.mvy);
    }
    if (--this.thinkT <= 0) {
      this.thinkT = 90 + Math.random() * 60;
      const p = play.player;
      if (Math.hypot(p.cx - this.cx, p.cy - this.cy) < 9 * TILE) {
        play.spawn(new FirePellet(this.cx, this.cy, p.cx, p.cy));
        sfx('burn');
      } else {
        this.hopT = 20;
        const a = Math.random() * Math.PI * 2;
        this.mvx = Math.cos(a) * 0.8;
        this.mvy = Math.sin(a) * 0.8;
      }
    }
  }

  draw(ctx, cam) { this.drawFrames(ctx, cam, 'emberkin', 8); }
}

// ---------------- Cindershell: flame-cloaked tank ----------------
export class Cindershell extends Enemy {
  constructor(def) {
    super(def, 14, 12);
    this.hp = this.maxHp = 4;
    this.cloak = 999999;
    this.trailT = 0;
    this.hurtsPlayer = 1;
  }

  swordImmune() { return this.cloak > 0; }

  update(play) {
    this.baseTick();
    this.animT++;
    if (this.stunned > 0) {
      // stunning (boomerang/hookshot) douses the cloak for a while
      if (this.cloak > 0) { this.cloak = 0; this.doused = 240; sfx('splash'); }
      this.stunned--;
      return;
    }
    if (this.doused > 0 && --this.doused === 0) {
      this.cloak = 999999;
      play.particles.spawn('ember', this.cx, this.cy, 8);
    }
    if (this.knocked) { moveEntity(this, play.map, this.knockX, this.knockY); return; }
    this.seek(play, play.player.cx, play.player.cy, 0.3);
    if (this.cloak > 0 && ++this.trailT >= 30) {
      this.trailT = 0;
      play.spawn(new Flame(this.cx - 4, this.cy - 4, 90));
    }
  }

  draw(ctx, cam) {
    this.drawFrames(ctx, cam, 'cindershell', 14);
    if (this.cloak > 0 && this.visible) {
      // flame cloak shimmer
      ctx.fillStyle = this.animT % 8 < 4 ? C.lavaLight : C.lava;
      for (let i = 0; i < 4; i++) {
        const a = this.animT / 7 + i * 1.6;
        ctx.fillRect(Math.round(this.cx + Math.cos(a) * 8 - cam.x),
          Math.round(this.cy - 4 + Math.sin(a) * 5 - cam.y), 2, 3);
      }
    }
  }
}

// ---------------- Tidemaw: underwater ambusher ----------------
export class Tidemaw extends Enemy {
  constructor(def) {
    super(def);
    this.hp = this.maxHp = 3;
    this.state = 'lurk';
    this.canCross = true;
    this.home = { x: this.x, y: this.y };
    this.stunImmune = true;
  }

  swordImmune() { return this.state === 'lurk'; }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    const p = play.player;
    const dist = Math.hypot(p.cx - this.cx, p.cy - this.cy);
    if (this.state === 'lurk') {
      this.hurtsPlayer = 0;
      // drift in water near home
      this.t = (this.t || 0) + 0.03;
      this.x = this.home.x + Math.cos(this.t) * 12;
      this.y = this.home.y + Math.sin(this.t * 0.7) * 12;
      if (dist < 3.2 * TILE) {
        this.state = 'lunge';
        this.lungeT = 50;
        this.lvx = (p.cx - this.cx) / dist * 2.4;
        this.lvy = (p.cy - this.cy) / dist * 2.4;
        sfx('splash');
        play.particles.spawn('splash', this.cx, this.cy, 8);
      }
    } else {
      this.hurtsPlayer = 1;
      this.lungeT--;
      this.x += this.lvx;
      this.y += this.lvy;
      this.lvx *= 0.96;
      this.lvy *= 0.96;
      if (this.lungeT <= 0) {
        this.state = 'lurk';
        this.home = { x: this.x, y: this.y };
        // swim back toward water if beached
        const f = tileUnder(this, play.map);
        if (!f.water) {
          this.x = this.spawnHome?.x ?? this.x;
          this.y = this.spawnHome?.y ?? this.y;
        }
        play.particles.spawn('splash', this.cx, this.cy, 6);
      }
    }
  }

  draw(ctx, cam) {
    if (this.state === 'lurk') {
      // just a ripple
      const f = Math.floor(this.animT / 14) % 2;
      ctx.fillStyle = C.waterLight;
      const x = Math.round(this.cx - cam.x);
      const y = Math.round(this.cy - cam.y);
      ctx.fillRect(x - 5 - f, y, 4, 1);
      ctx.fillRect(x + 2 + f, y - 1, 4, 1);
      ctx.fillRect(x - 1, y + 2 + f, 3, 1);
      return;
    }
    this.drawFrames(ctx, cam, 'tidemaw', 6);
  }
}

// ---------------- Voltjelly: timed spark phases ----------------
export class Voltjelly extends Enemy {
  constructor(def) {
    super(def, 12, 12);
    this.hp = this.maxHp = 2;
    this.cycle = Math.floor(Math.random() * 120);
    this.stunImmune = true;
  }

  get sparking() { return this.cycle % 180 > 120; }
  get telegraph() { return this.cycle % 180 > 95 && !this.sparking; }

  swordImmune(player, play) {
    if (this.sparking) {
      player.takeDamage(play, 1, this.cx, this.cy);
      return true;
    }
    return false;
  }

  update(play) {
    this.cycle++;
    this.hurtsPlayer = this.sparking ? 1 : 0.5;
    if (!this.baseEnemyTick(play)) return;
    if (--this.thinkT <= 0) {
      this.thinkT = 50 + Math.random() * 40;
      const a = Math.random() * Math.PI * 2;
      this.mvx = Math.cos(a) * 0.4;
      this.mvy = Math.sin(a) * 0.4;
    }
    moveEntity(this, play.map, this.mvx || 0, this.mvy || 0);
  }

  draw(ctx, cam) {
    if (!this.visible) return;
    const frame = Math.floor(this.animT / 12) % 2;
    this.drawSpriteAnchored(ctx, cam, `voltjelly_${frame}`);
    if (this.sparking || (this.telegraph && this.animT % 6 < 3)) {
      ctx.fillStyle = this.sparking ? C.yellow : C.white;
      const a = this.animT / 3;
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(Math.round(this.cx + Math.cos(a + i * 2.1) * 9 - cam.x),
          Math.round(this.cy - 3 + Math.sin(a + i * 2.1) * 7 - cam.y), 2, 2);
      }
    }
  }
}

// ---------------- Wraithguard: blocking duelist ----------------
export class Wraithguard extends Enemy {
  constructor(def) {
    super(def, 12, 12);
    this.hp = this.maxHp = 4;
    this.state = 'approach';
    this.stateT = 0;
    this.hurtsPlayer = 1;
  }

  swordImmune(player, play) {
    if (this.stunned > 0 || this.state === 'counter') return false;
    // blocks frontal hits, then counterattacks
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    const facing = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.dir];
    if (dx * facing[0] + dy * facing[1] > -2) {
      this.state = 'counter';
      this.stateT = 26;
      play.particles.spawn('sparkle', this.cx, this.cy, 3);
      return true;
    }
    return false;
  }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    const p = play.player;
    this.stateT--;
    if (this.state === 'approach') {
      this.seek(play, p.cx, p.cy, 0.55);
      const dist = Math.hypot(p.cx - this.cx, p.cy - this.cy);
      if (dist < 26 && this.stateT <= 0) {
        // sidestep then slash
        this.state = Math.random() < 0.5 ? 'sidestep' : 'slash';
        this.stateT = this.state === 'sidestep' ? 18 : 20;
        if (this.state === 'sidestep') {
          const perp = Math.random() < 0.5 ? 1 : -1;
          this.svx = -(p.cy - this.cy) / dist * 1.6 * perp;
          this.svy = (p.cx - this.cx) / dist * 1.6 * perp;
        }
      }
    } else if (this.state === 'sidestep') {
      moveEntity(this, play.map, this.svx, this.svy);
      if (this.stateT <= 0) { this.state = 'approach'; this.stateT = 20; }
    } else if (this.state === 'slash' || this.state === 'counter') {
      if (this.stateT === 10) {
        // strike!
        const box = { x: this.cx - 14, y: this.cy - 14, w: 28, h: 28 };
        if (aabbOverlap(box, p.box)) p.takeDamage(play, 1, this.cx, this.cy);
        sfx('sword');
      }
      if (this.stateT <= 0) { this.state = 'approach'; this.stateT = 40; }
    }
  }

  draw(ctx, cam) {
    this.drawFrames(ctx, cam, this.state === 'slash' || this.state === 'counter' ? 'wraithguard_atk' : 'wraithguard', 14);
  }
}

// ---------------- shared projectiles / hazards ----------------

export class FirePellet extends Entity {
  constructor(x, y, tx, ty) {
    super(x - 3, y - 3, 6, 6);
    this.t = 0;
    this.dur = 55;
    this.sx = x; this.sy = y;
    this.tx = tx; this.ty = ty;
    this.canCross = true;
  }

  update(play) {
    this.t++;
    const k = this.t / this.dur;
    this.x = this.sx + (this.tx - this.sx) * k - 3;
    this.y = this.sy + (this.ty - this.sy) * k - 3;
    if (this.t >= this.dur) {
      this.dead = true;
      play.particles.spawn('ember', this.cx, this.cy, 8);
      const box = { x: this.x - 4, y: this.y - 4, w: 14, h: 14 };
      if (aabbOverlap(box, play.player.box)) {
        play.player.takeDamage(play, 1, this.cx, this.cy);
      }
    }
  }

  draw(ctx, cam) {
    const k = this.t / this.dur;
    const arc = Math.sin(k * Math.PI) * 22;
    // landing shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(this.tx - 3 - cam.x), Math.round(this.ty - 1 - cam.y), 6, 2);
    ctx.fillStyle = this.t % 6 < 3 ? C.lavaLight : C.lava;
    ctx.beginPath();
    ctx.arc(Math.round(this.cx - cam.x), Math.round(this.cy - arc - cam.y), 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class Flame extends Entity {
  constructor(x, y, life = 90) {
    super(x, y, 8, 8);
    this.life = life;
    this.canCross = true;
  }

  update(play) {
    if (--this.life <= 0) { this.dead = true; return; }
    if (aabbOverlap(this.box, play.player.box)) {
      play.player.takeDamage(play, 0.5, this.cx, this.cy + 6);
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    const f = Math.floor(this.life / 5) % 2;
    ctx.fillStyle = f ? C.lava : C.lavaLight;
    ctx.fillRect(x + 1, y + 2, 6, 6);
    ctx.fillStyle = f ? C.yellow : C.orange;
    ctx.fillRect(x + 2, y + 4 - f, 4, 4);
  }
}

export function registerEnemies(register) {
  register('thornling', Thornling);
  register('pricklepod', Pricklepod);
  register('gloomwisp', Gloomwisp);
  register('emberkin', Emberkin);
  register('cindershell', Cindershell);
  register('tidemaw', Tidemaw);
  register('voltjelly', Voltjelly);
  register('wraithguard', Wraithguard);
}
