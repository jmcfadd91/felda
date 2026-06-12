// The four bosses. Each runs a multi-phase state machine and, on defeat,
// sets its clear flag, drops a Heart Vessel and relic, and autosaves.

import { Entity } from '../engine/entity.js';
import { Enemy, Gloomwisp, FirePellet, Flame } from './enemies.js';
import { aabbOverlap, moveEntity } from '../engine/physics.js';
import { TILE } from '../gfx/tiles.js';
import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { COLORS as C } from '../gfx/palette.js';
import { sfx } from '../audio/sfx.js';
import { drawText } from '../ui/textrender.js';

class Boss extends Enemy {
  constructor(def, w, h) {
    super(def, w, h);
    this.isBoss = true;
    this.clearFlag = def.clearFlag;
    this.relic = def.relic || null;     // 'verdant' | 'cinder' | 'tide' | null
    this.exitTo = def.exitTo || null;   // warp target after relic pickup
    this.hurtIframes = 30;
    this.stunImmune = true;
    this.introT = 90;
  }

  die() {
    this.dead = true;
    this.noDrop = true;
  }

  onDeath(play) {
    sfx('fanfare');
    play.camera.shake(30, 4);
    for (let i = 0; i < 6; i++) {
      setTimeout(() => play.particles.spawn('boom', this.cx + (Math.random() - 0.5) * 30, this.cy + (Math.random() - 0.5) * 30, 10), i * 120);
    }
    if (this.clearFlag) play.setFlag(this.clearFlag);
    const d = play.dungeon();
    if (d) d.cleared = true;
    play.spawn(new HeartContainer(this.cx - 20, this.cy));
    if (this.relic) play.spawn(new RelicPickup(this.cx + 12, this.cy, this.relic, this.exitTo));
    play.autosave();
  }

  drawHpBar(ctx) {
    const w = 120;
    const x = (VIEW_W - w) / 2;
    const y = VIEW_H - 38;
    ctx.fillStyle = 'rgba(8,8,20,0.8)';
    ctx.fillRect(x - 2, y - 2, w + 4, 8);
    ctx.fillStyle = C.redDark;
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = C.red;
    ctx.fillRect(x, y, Math.max(0, w * this.hp / this.maxHp), 4);
  }
}

// ---------------- Bramblemaw (forest) ----------------
// Phase 1: kill the four thorn vines guarding it. Phase 2: it lunges around
// the arena; strike the bulb while it rests.
export class Bramblemaw extends Boss {
  constructor(def, play) {
    super(def, 22, 20);
    this.hp = this.maxHp = 8;
    this.state = 'guarded';
    this.home = { x: this.x, y: this.y };
    this.vines = [];
    this.wispT = 0;
    this.restT = 0;
    for (const [dx, dy] of [[-3, -1], [3, -1], [-3, 2], [3, 2]]) {
      const v = new ThornVine({ x: def.x + dx, y: def.y + dy });
      this.vines.push(v);
    }
    this.hurtsPlayer = 1;
  }

  enter(play) {
    for (const v of this.vines) play.spawn(v);
    sfx('bossRoar');
  }

  swordImmune() { return this.state === 'guarded' || this.state === 'lunge'; }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    if (this.introT > 0) { this.introT--; return; }
    this.wispT++;
    if (this.state === 'guarded') {
      if (this.vines.every(v => v.dead)) {
        this.state = 'rest';
        this.restT = 90;
        sfx('bossRoar');
        play.camera.shake(15, 3);
      }
      if (this.wispT % 300 === 250) play.spawn(new Gloomwisp({ x: this.x / TILE, y: this.y / TILE }));
    } else if (this.state === 'rest') {
      if (--this.restT <= 0) {
        this.state = 'lunge';
        const p = play.player;
        const d = Math.hypot(p.cx - this.cx, p.cy - this.cy) || 1;
        this.lvx = (p.cx - this.cx) / d * 2.6;
        this.lvy = (p.cy - this.cy) / d * 2.6;
        this.lungeT = 40;
        sfx('bossRoar');
      }
      if (this.wispT % 240 === 200) play.spawn(new Gloomwisp({ x: this.x / TILE, y: this.y / TILE }));
    } else if (this.state === 'lunge') {
      this.lungeT--;
      const r = moveEntity(this, play.map, this.lvx, this.lvy);
      if (this.lungeT <= 0 || r.hitX || r.hitY) {
        this.state = 'rest';
        this.restT = 110;
        play.camera.shake(8, 2);
      }
    }
  }

  draw(ctx, cam) {
    if (!this.visible) return;
    this.drawShadow(ctx, cam);
    const f = Math.floor(this.animT / 10) % 2;
    const open = this.state !== 'guarded';
    this.drawSpriteAnchored(ctx, cam, `bramblemaw_${open ? 'open' : 'closed'}_${f}`);
    this.drawHpBar(ctx);
  }
}

class ThornVine extends Enemy {
  constructor(def) {
    super(def, 12, 14);
    this.hp = this.maxHp = 2;
    this.hurtsPlayer = 0.5;
    this.noShutterCount = true;
    this.t = Math.random() * 6;
  }

  update(play) {
    if (!this.baseEnemyTick(play)) return;
    this.t += 0.04;
    this.x += Math.cos(this.t) * 0.3;
    this.y += Math.sin(this.t * 0.8) * 0.2;
  }

  draw(ctx, cam) { this.drawFrames(ctx, cam, 'thornvine', 14); }
}

// ---------------- Magmarch (fire) ----------------
// Charges; blast it mid-charge to flip it, then strike the belly.
// Below half health it circles and rains embers.
export class Magmarch extends Boss {
  constructor(def) {
    super(def, 26, 18);
    this.hp = this.maxHp = 10;
    this.state = 'stalk';
    this.stateT = 60;
    this.flipT = 0;
    this.hurtsPlayer = 1;
  }

  enter() { sfx('bossRoar'); }

  swordImmune() { return this.flipT <= 0; }

  onBlast(play) { this.flip(play); }

  hurt(dmg, fx, fy, k) {
    if (this.flipT > 0) return super.hurt(dmg, fx, fy, 0);
    // armored: blasts handled via onBlast (play.hitWithBlast calls hurt for
    // enemies, so flip instead when charging)
    if (this.state === 'charge' && this._blastIncoming) {
      this._blastIncoming = false;
      return false;
    }
    return false;
  }

  flip(play) {
    if (this.flipT > 0) return;
    if (this.state !== 'charge') return; // only vulnerable mid-charge
    this.flipT = 170;
    this.state = 'flipped';
    sfx('bossRoar');
    play.camera.shake(14, 3);
  }

  update(play) {
    this.baseTick();
    this.animT++;
    if (this.introT > 0) { this.introT--; return; }
    const p = play.player;
    if (this.flipT > 0) {
      if (--this.flipT <= 0) {
        this.state = 'stalk';
        this.stateT = 50;
      }
      return;
    }
    this.stateT--;
    if (this.state === 'stalk') {
      this.seek(play, p.cx, p.cy, 0.4);
      if (this.stateT <= 0) {
        this.state = 'charge';
        const d = Math.hypot(p.cx - this.cx, p.cy - this.cy) || 1;
        this.cvx = (p.cx - this.cx) / d * 2.8;
        this.cvy = (p.cy - this.cy) / d * 2.8;
        sfx('bossRoar');
      }
      if (this.hp <= this.maxHp / 2 && this.stateT % 45 === 0) {
        play.spawn(new FirePellet(this.cx, this.cy,
          p.cx + (Math.random() - 0.5) * 60, p.cy + (Math.random() - 0.5) * 60));
      }
    } else if (this.state === 'charge') {
      const r = moveEntity(this, play.map, this.cvx, this.cvy);
      if (r.hitX || r.hitY) {
        this.state = 'stunwall';
        this.stateT = 80;
        play.camera.shake(16, 4);
        sfx('bombBoom');
      }
    } else if (this.state === 'stunwall') {
      if (this.stateT <= 0) { this.state = 'stalk'; this.stateT = 80; }
    }
  }

  draw(ctx, cam) {
    if (!this.visible) return;
    this.drawShadow(ctx, cam);
    const f = Math.floor(this.animT / (this.state === 'charge' ? 5 : 12)) % 2;
    const name = this.flipT > 0 ? 'magmarch_flipped' : `magmarch_${f}`;
    this.drawSpriteAnchored(ctx, cam, name);
    if (this.state === 'stunwall' && this.animT % 10 < 5) {
      drawText(ctx, '!', Math.round(this.cx - cam.x), Math.round(this.y - 12 - cam.y), C.yellow);
    }
    this.drawHpBar(ctx);
  }
}

// ---------------- Abyssal Choir (water) ----------------
// Three serpents share one health pool. Hook a surfaced serpent to pin it,
// then strike. Final third: the room current drags the player.
export class AbyssalChoir extends Boss {
  constructor(def, play) {
    super(def, 1, 1);
    this.hp = this.maxHp = 12;
    this.invisible = true;
    this.canCross = true;
    this.hurtsPlayer = 0;
    this.serpents = [0, 1, 2].map(i => new Serpent(def, this, i));
  }

  enter(play) {
    for (const s of this.serpents) play.spawn(s);
    sfx('bossRoar');
  }

  swordImmune() { return true; }
  hurt() { return false; }

  sharedHurt(play, dmg, fx, fy) {
    this.hp -= dmg;
    sfx('hit');
    if (this.hp <= 0) {
      this.dead = true;
      for (const s of this.serpents) { s.dead = true; s.noDrop = true; }
    }
  }

  update(play) {
    if (this.introT > 0) { this.introT--; return; }
    // phase 2 current
    if (this.hp <= this.maxHp / 3 && !this.dead) {
      const a = performance.now() / 900;
      play.player.x += Math.cos(a) * 0.45;
      play.player.y += Math.sin(a) * 0.45;
      if (play.game.ticks % 40 === 0) play.particles.spawn('splash', play.player.cx + (Math.random() - 0.5) * 40, play.player.cy + (Math.random() - 0.5) * 30, 3);
    }
  }

  draw(ctx) {
    if (!this.dead) this.drawHpBar(ctx);
  }
}

class Serpent extends Enemy {
  constructor(def, choir, idx) {
    super(def, 14, 14);
    this.choir = choir;
    this.idx = idx;
    this.hp = this.maxHp = 9999;
    this.canCross = true;
    this.noShutterCount = true;
    this.t = idx * 2.1;
    this.home = { x: (def.x + (idx - 1) * 3) * TILE, y: def.y * TILE };
    this.state = 'swim';
    this.stateT = 60 + idx * 80;
    this.pinT = 0;
  }

  swordImmune() { return this.pinT <= 0; }

  hurt(dmg, fx, fy) {
    if (this.pinT <= 0) return false;
    if (this.iframes > 0) return false;
    this.iframes = 20;
    this.choir.sharedHurt(null, dmg, fx, fy);
    return true;
  }

  update(play) {
    this.animT++;
    if (this.iframes > 0) this.iframes--;
    if (this.choir.dead) { this.dead = true; return; }
    const fast = this.choir.hp <= this.choir.maxHp / 3;
    this.t += fast ? 0.035 : 0.02;
    this.stateT--;
    // boomerang/hook hits: play.boomerangTouch sets stunned -> pin
    if (this.stunned > 0) {
      this.stunned = 0;
      if (this.state === 'surface') {
        this.pinT = 130;
        this.state = 'pinned';
        sfx('hookshot');
      }
    }
    if (this.state === 'swim') {
      this.hurtsPlayer = 0.5;
      this.x = this.home.x + Math.cos(this.t) * 50;
      this.y = this.home.y + Math.sin(this.t * 1.4) * 26;
      if (this.stateT <= 0) { this.state = 'surface'; this.stateT = fast ? 90 : 140; sfx('splash'); }
    } else if (this.state === 'surface') {
      this.hurtsPlayer = 0.5;
      if (this.stateT % 70 === 30) {
        const p = play.player;
        play.spawn(new FirePellet(this.cx, this.cy, p.cx, p.cy));
      }
      if (this.stateT <= 0) { this.state = 'swim'; this.stateT = 130 + Math.random() * 90; }
    } else if (this.state === 'pinned') {
      this.hurtsPlayer = 0;
      if (--this.pinT <= 0) { this.state = 'swim'; this.stateT = 160; }
    }
  }

  draw(ctx, cam) {
    if (this.state === 'swim') {
      // dorsal ridge above the water
      const x = Math.round(this.cx - cam.x);
      const y = Math.round(this.cy - cam.y);
      ctx.fillStyle = C.blueDark;
      ctx.fillRect(x - 4, y - 2, 8, 4);
      ctx.fillStyle = C.waterLight;
      ctx.fillRect(x - 7, y + 2, 4, 1);
      ctx.fillRect(x + 4, y + 2, 4, 1);
      return;
    }
    if (this.iframes > 0 && this.animT % 4 < 2) return;
    const f = Math.floor(this.animT / 10) % 2;
    this.drawSpriteAnchored(ctx, cam, this.state === 'pinned' ? 'serpent_pinned' : `serpent_${f}`);
  }
}

// ---------------- Vhorrun, the Sleepless King (final) ----------------
// Phase 1: deflect his dark bolts back with sword swings. Phase 2: he rains
// ruin from above. Phase 3: a desperate melee where everything hurts him.
export class Vhorrun extends Boss {
  constructor(def) {
    super(def, 16, 22);
    this.hp = this.maxHp = 16;
    this.state = 'float';
    this.stateT = 80;
    this.stunT = 0;
    this.hurtsPlayer = 1;
    this.home = { x: this.x, y: this.y };
  }

  enter() { sfx('bossRoar'); }

  get phase() {
    return this.hp > this.maxHp * 2 / 3 ? 1 : this.hp > this.maxHp / 3 ? 2 : 3;
  }

  swordImmune() {
    return this.phase !== 3 && this.stunT <= 0;
  }

  boltHit(play) {
    // a reflected bolt connects
    this.stunT = 120;
    this.state = 'stunned';
    sfx('bossRoar');
    play.camera.shake(12, 3);
    play.particles.spawn('dark', this.cx, this.cy, 14);
  }

  update(play) {
    this.baseTick();
    this.animT++;
    if (this.introT > 0) { this.introT--; return; }
    const p = play.player;
    if (this.stunT > 0) {
      if (--this.stunT <= 0) this.state = 'float';
      return;
    }
    this.stateT--;
    if (this.phase === 3) {
      // desperate chase
      this.seek(play, p.cx, p.cy, 1.0);
      if (this.stateT <= 0) {
        this.stateT = 90;
        for (let i = 0; i < 4; i++) {
          play.spawn(new FirePellet(this.cx, this.cy, p.cx + (Math.random() - 0.5) * 70, p.cy + (Math.random() - 0.5) * 70));
        }
      }
      return;
    }
    if (this.state === 'float') {
      this.t = (this.t || 0) + 0.03;
      this.x += Math.cos(this.t) * 0.7;
      this.y += Math.sin(this.t * 1.3) * 0.4;
      if (this.stateT <= 0) {
        if (this.phase === 2 && Math.random() < 0.45) {
          this.state = 'rain';
          this.stateT = 120;
          sfx('bossRoar');
        } else {
          this.state = 'teleport';
          this.stateT = 30;
          play.particles.spawn('dark', this.cx, this.cy, 12);
        }
      }
    } else if (this.state === 'teleport') {
      if (this.stateT === 15) {
        const ang = Math.random() * Math.PI * 2;
        this.x = this.home.x + Math.cos(ang) * 60;
        this.y = this.home.y + Math.sin(ang) * 36;
        play.particles.spawn('dark', this.cx, this.cy, 12);
      }
      if (this.stateT <= 0) {
        play.spawn(new DarkBolt(this.cx, this.cy, p.cx, p.cy, this));
        sfx('arrow');
        this.state = 'float';
        this.stateT = this.phase === 2 ? 70 : 110;
      }
    } else if (this.state === 'rain') {
      if (this.stateT % 24 === 0) {
        play.spawn(new FirePellet(this.cx, this.cy - 20, p.cx + (Math.random() - 0.5) * 80, p.cy + (Math.random() - 0.5) * 60));
      }
      if (this.stateT <= 0) { this.state = 'float'; this.stateT = 80; }
    }
  }

  draw(ctx, cam) {
    if (!this.visible) return;
    const f = Math.floor(this.animT / 12) % 2;
    const hover = this.phase === 3 ? 0 : Math.round(Math.sin(this.animT / 20) * 3) - 4;
    const name = this.stunT > 0 ? 'vhorrun_stun' : `vhorrun_${f}`;
    this.drawSpriteAnchored(ctx, cam, name, { yOff: hover });
    this.drawHpBar(ctx);
  }
}

export class DarkBolt extends Entity {
  constructor(x, y, tx, ty, owner) {
    super(x - 4, y - 4, 8, 8);
    const d = Math.hypot(tx - x, ty - y) || 1;
    this.vx = (tx - x) / d * 1.8;
    this.vy = (ty - y) / d * 1.8;
    this.owner = owner;
    this.reflected = false;
    this.life = 240;
    this.canCross = true;
  }

  update(play) {
    this.x += this.vx;
    this.y += this.vy;
    if (--this.life <= 0) { this.dead = true; return; }
    const p = play.player;
    if (!this.reflected) {
      // sword deflection: bolt inside an active swing arc bounces back
      if (p.attacking && aabbOverlap(this.box, p.swordBox(18))) {
        this.reflected = true;
        const d = Math.hypot(this.owner.cx - this.cx, this.owner.cy - this.cy) || 1;
        const speed = 2.6;
        this.vx = (this.owner.cx - this.cx) / d * speed;
        this.vy = (this.owner.cy - this.cy) / d * speed;
        sfx('clink');
        play.particles.spawn('sparkle', this.cx, this.cy, 6);
        return;
      }
      if (aabbOverlap(this.box, p.box)) {
        this.dead = true;
        p.takeDamage(play, 1, this.cx, this.cy);
      }
    } else if (aabbOverlap(this.box, this.owner.box)) {
      this.dead = true;
      this.owner.boltHit(play);
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.cx - cam.x);
    const y = Math.round(this.cy - cam.y);
    ctx.fillStyle = this.reflected ? C.yellow : C.purple;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.reflected ? C.white : C.purpleDark;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

// ---------------- boss rewards ----------------

export class HeartContainer extends Entity {
  constructor(x, y) {
    super(x, y, 12, 12);
    this.canCross = true;
    this.bob = 0;
  }

  update(play) {
    this.bob++;
    if (aabbOverlap(this.box, play.player.box)) {
      this.dead = true;
      play.giveContents('heartcontainer', this.cx, this.cy);
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y) + Math.round(Math.sin(this.bob / 14) * 2);
    ctx.fillStyle = C.redDark;
    ctx.fillRect(x + 2, y, 8, 2);
    ctx.fillRect(x, y + 2, 12, 5);
    ctx.fillRect(x + 2, y + 7, 8, 2);
    ctx.fillRect(x + 4, y + 9, 4, 2);
    ctx.fillStyle = C.red;
    ctx.fillRect(x + 3, y + 1, 6, 2);
    ctx.fillRect(x + 1, y + 3, 10, 3);
    ctx.fillStyle = C.white;
    ctx.fillRect(x + 3, y + 2, 2, 2);
  }
}

const RELIC_COLORS = {
  verdant: [C.green, C.greenDark],
  cinder: [C.lava, C.lavaDark],
  tide: [C.water, C.waterDeep],
};

const RELIC_TEXT = {
  verdant: 'You claimed the VERDANT RELIC! The forest breathes easier. Its warmth hums against your palm.',
  cinder: 'You claimed the CINDER RELIC! The mountain\'s heart beats slow and calm once more.',
  tide: 'You claimed the TIDE RELIC! The waters clear, and something like a song thanks you.',
};

export class RelicPickup extends Entity {
  constructor(x, y, relic, exitTo) {
    super(x, y, 12, 12);
    this.relic = relic;
    this.exitTo = exitTo;
    this.canCross = true;
    this.bob = 0;
  }

  update(play) {
    this.bob++;
    if (this.bob % 12 === 0) play.particles.spawn('sparkle', this.cx, this.cy, 2);
    if (aabbOverlap(this.box, play.player.box)) {
      this.dead = true;
      play.setFlag(`relic_${this.relic}`);
      sfx('secret');
      play.say(RELIC_TEXT[this.relic], {
        speaker: 'RELIC',
        onDone: () => {
          play.autosave();
          if (this.exitTo) play.changeMap(this.exitTo.map, this.exitTo.x, this.exitTo.y);
        },
      });
    }
  }

  draw(ctx, cam) {
    const [main, dark] = RELIC_COLORS[this.relic] || [C.yellow, C.orange];
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y) + Math.round(Math.sin(this.bob / 12) * 2);
    ctx.fillStyle = dark;
    ctx.fillRect(x + 4, y, 4, 12);
    ctx.fillRect(x + 1, y + 3, 10, 5);
    ctx.fillStyle = main;
    ctx.fillRect(x + 5, y + 1, 2, 10);
    ctx.fillRect(x + 2, y + 4, 8, 3);
    ctx.fillStyle = C.white;
    ctx.fillRect(x + 5, y + 4, 2, 2);
  }
}

export function registerBosses(register) {
  register('bramblemaw', Bramblemaw);
  register('magmarch', Magmarch);
  register('abyssalchoir', AbyssalChoir);
  register('vhorrun', Vhorrun);
}
