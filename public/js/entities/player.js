// The hero: movement, sword combat (tap swing + charged spin), item use,
// interaction probing. Hitbox is 10x10, feet-anchored under a 16x16 sprite.

import { Entity } from '../engine/entity.js';
import { moveEntity, tileUnder, aabbOverlap } from '../engine/physics.js';
import { getSprite } from '../gfx/sprites.js';
import { TILE } from '../gfx/tiles.js';
import { useItem } from './items.js';
import { sfx } from '../audio/sfx.js';

const SPEED = 1.3;
const SWING_FRAMES = 14;
const SPIN_CHARGE = 45;

export class Player extends Entity {
  constructor(x, y, state) {
    super(x, y, 10, 10);
    this.state = state;        // live save-state object (hearts, items...)
    this.hurtIframes = 60;
    this.animTime = 0;
    this.swing = 0;            // frames remaining in sword swing
    this.spin = 0;             // frames remaining in spin attack
    this.charge = 0;           // A-held charge counter
    this.itemLock = 0;         // frames during which items control the player
    this.swordHits = new Set(); // entities already hit by current swing
    this.fallTime = 0;         // pit fall animation
    this.respawnPos = { x, y };
    this.canCross = false;
  }

  get attacking() { return this.swing > 0 || this.spin > 0; }

  update(play) {
    this.baseTick();
    if (this.fallTime > 0) return this._fallTick(play);

    const input = play.game.input;
    const busy = this.attacking || this.itemLock > 0;

    // movement
    let dx = 0, dy = 0;
    if (this.knocked) {
      dx = this.knockX;
      dy = this.knockY;
    } else if (!busy) {
      const v = input.dirVector();
      if (v.x || v.y) {
        const len = Math.hypot(v.x, v.y);
        dx = (v.x / len) * SPEED;
        dy = (v.y / len) * SPEED;
        // facing: prefer the axis of movement, sticky during diagonal
        if (v.x && !v.y) this.dir = v.x > 0 ? 'right' : 'left';
        else if (v.y && !v.x) this.dir = v.y > 0 ? 'down' : 'up';
        else if (v.y) this.dir = v.y > 0 ? 'down' : 'up';
        this.animTime++;
      } else {
        this.animTime = 0;
      }
    }
    if (dx || dy) moveEntity(this, play.map, dx, dy, play.solidEntities());

    // hazard tiles
    const under = tileUnder(this, play.map);
    if (under.pit || under.water || under.lava) {
      // shouldn't happen (treated solid) but recover gracefully
      this.startFall(play, under.lava ? 1 : 0.5);
      return;
    }

    if (this.itemLock > 0) this.itemLock--;

    // sword
    if (this.swing > 0) {
      this.swing--;
      this._swordHitCheck(play);
    } else if (this.spin > 0) {
      this.spin--;
      this._spinHitCheck(play);
    } else if (!busy) {
      if (input.justPressed('a') && this.state.items.includes('sword')) {
        this.swing = SWING_FRAMES;
        this.swordHits.clear();
        sfx('sword');
      } else if (input.held('a') && this.charge >= 0 && this.state.items.includes('sword')) {
        this.charge++;
      }
      if (!input.held('a')) {
        if (this.charge >= SPIN_CHARGE) {
          this.spin = 20;
          this.swordHits.clear();
          sfx('spin');
        }
        this.charge = 0;
      }
      // item (B button)
      if (input.justPressed('b') && this.state.equippedB) {
        useItem(this.state.equippedB, this, play);
      }
    }
  }

  // sword arc box for current facing
  swordBox(reach = 14) {
    const r = { x: this.x, y: this.y, w: this.w, h: this.h };
    switch (this.dir) {
      case 'up': return { x: r.x - 3, y: r.y - reach, w: r.w + 6, h: reach };
      case 'down': return { x: r.x - 3, y: r.y + r.h, w: r.w + 6, h: reach };
      case 'left': return { x: r.x - reach, y: r.y - 3, w: reach, h: r.h + 6 };
      case 'right': return { x: r.x + r.w, y: r.y - 3, w: reach, h: r.h + 6 };
    }
  }

  _swordDamage() { return this.state.swordLevel >= 2 ? 2 : 1; }

  _swordHitCheck(play) {
    if (this.swing > SWING_FRAMES - 2 || this.swing < 4) return;
    const box = this.swordBox();
    play.hitWithSword(box, this._swordDamage(), this);
  }

  _spinHitCheck(play) {
    const box = { x: this.x - 14, y: this.y - 14, w: this.w + 28, h: this.h + 28 };
    play.hitWithSword(box, this._swordDamage() * 2, this);
  }

  // box just in front of the player, for reading signs / talking / opening
  probeBox() {
    return this.swordBox(10);
  }

  takeDamage(play, dmg, fromX, fromY) {
    if (this.iframes > 0 || this.dead || this.fallTime > 0) return;
    if (this.hurt(dmg, fromX, fromY, 2.6)) {
      this.state.hearts = Math.max(0, this.state.hearts - dmg * 0.5);
      sfx('hurt');
      play.camera.shake(8, 2);
      this.charge = 0;
      if (this.state.hearts <= 0) play.gameOver();
    }
  }

  startFall(play, dmg) {
    this.fallTime = 40;
    this._fallDamage = dmg;
    sfx('fall');
  }

  _fallTick(play) {
    this.fallTime--;
    if (this.fallTime === 0) {
      this.x = this.respawnPos.x;
      this.y = this.respawnPos.y;
      this.state.hearts = Math.max(0, this.state.hearts - this._fallDamage);
      this.iframes = 45;
      if (this.state.hearts <= 0) play.gameOver();
    }
  }

  heal(amount) {
    this.state.hearts = Math.min(this.state.heartsMax, this.state.hearts + amount);
  }

  rememberSafeSpot() {
    this.respawnPos = { x: this.x, y: this.y };
  }

  draw(ctx, cam) {
    if (this.fallTime > 0) {
      // shrink into the pit
      const t = this.fallTime / 40;
      const s = getSprite(this._spriteName(), this._spriteOpts());
      const size = Math.max(2, Math.floor(16 * t));
      ctx.drawImage(s,
        Math.round(this.cx - size / 2 - cam.x),
        Math.round(this.cy - size / 2 - cam.y), size, size);
      return;
    }
    if (!this.visible) return;
    this.drawShadow(ctx, cam);
    this._drawSwordBehind(ctx, cam);
    this.drawSpriteAnchored(ctx, cam, this._spriteName(), this._spriteOpts());
    this._drawSwordFront(ctx, cam);
  }

  _spriteName() {
    if (this.attacking) {
      if (this.spin > 0) {
        const seq = ['hero_swing_down', 'hero_swing_side', 'hero_swing_up', 'hero_swing_side'];
        return seq[Math.floor((20 - this.spin) / 5) % 4];
      }
      return this.dir === 'left' || this.dir === 'right' ? 'hero_swing_side' : `hero_swing_${this.dir}`;
    }
    const frame = Math.floor(this.animTime / 8) % 2;
    const base = this.dir === 'left' || this.dir === 'right' ? 'hero_side' : `hero_${this.dir}`;
    return `${base}_${frame}`;
  }

  _spriteOpts() {
    const opts = {};
    if (this.dir === 'left') opts.flip = true;
    if (this.spin > 0) {
      const phase = Math.floor((20 - this.spin) / 5) % 4;
      opts.flip = phase === 3;
    }
    if (this.state.swordLevel >= 2) opts.swap = 'tunic2';
    return opts;
  }

  _swordDir() {
    if (this.spin > 0) {
      return ['down', 'right', 'up', 'left'][Math.floor((20 - this.spin) / 5) % 4];
    }
    return this.dir;
  }

  _drawSwordFor(ctx, cam, dir) {
    const name = dir === 'left' || dir === 'right' ? 'sword_side' : `sword_${dir}`;
    const s = getSprite(name, { flip: dir === 'left' });
    let x = this.cx, y = this.cy;
    const ext = this.spin > 0 ? 10 : Math.min(10, (SWING_FRAMES - this.swing) * 2);
    if (dir === 'up') { x -= 4; y -= this.h / 2 + ext + s.height - 4; }
    if (dir === 'down') { x -= 0; y += this.h / 2 + ext - 4; }
    if (dir === 'left') { x -= this.w / 2 + ext + s.width - 4; y -= 1; }
    if (dir === 'right') { x += this.w / 2 + ext - 4; y -= 1; }
    ctx.drawImage(s, Math.round(x - cam.x), Math.round(y - cam.y));
  }

  _drawSwordBehind(ctx, cam) {
    if (!this.attacking) return;
    const d = this._swordDir();
    if (d === 'up') this._drawSwordFor(ctx, cam, d);
  }

  _drawSwordFront(ctx, cam) {
    if (!this.attacking) return;
    const d = this._swordDir();
    if (d !== 'up') this._drawSwordFor(ctx, cam, d);
  }
}
