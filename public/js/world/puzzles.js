// Interactive world objects: chests, signs, save statues, pots, doors,
// switches, torches, push blocks, and warps. Dungeon puzzles are built from
// these via per-map "channels" (switch -> gate wiring).

import { Entity } from '../engine/entity.js';
import { aabbOverlap } from '../engine/physics.js';
import { TILE } from '../gfx/tiles.js';
import { getSprite } from '../gfx/sprites.js';
import { COLORS as C } from '../gfx/palette.js';
import { sfx } from '../audio/sfx.js';
import { rollDrop, Pickup } from '../entities/pickups.js';

// ---------------- Chest ----------------
export class Chest extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 4, 12, 10);
    this.id = def.id;
    this.contents = def.contents || 'gems:5';
    this.solid = true;
    this.opened = false;
  }

  enter(play) {
    this.opened = play.isOpened(this.id);
  }

  interact(play) {
    if (this.opened) return true;
    if (play.player.dir !== 'up' && play.player.cy < this.cy) return true;
    this.opened = true;
    play.markOpened(this.id);
    sfx('chest');
    play.giveContents(this.contents, this.cx, this.cy);
    return true;
  }

  draw(ctx, cam) {
    this.drawSpriteAnchored(ctx, cam, this.opened ? 'chest_open' : 'chest_closed', { yOff: 2 });
  }
}

// ---------------- Sign ----------------
export class Sign extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 6, 12, 8);
    this.text = def.text || '...';
    this.solid = true;
  }

  interact(play) {
    play.say(this.text);
    return true;
  }

  draw(ctx, cam) {
    this.drawSpriteAnchored(ctx, cam, 'sign', { yOff: 4 });
  }
}

// ---------------- Save statue ----------------
export class SaveStatue extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 4, 12, 12);
    this.solid = true;
    this.glow = 0;
  }

  interact(play) {
    play.say('Rest at the wayshrine and record your journey?', {
      speaker: 'WAYSHRINE',
      choices: ['Save', 'Not yet'],
      onDone: (c) => {
        if (c === 0) {
          play.checkpointHere();
          play.player.heal(99);
          sfx('save');
          play.say('Your journey is recorded. Spirit and hearts restored.');
        }
      },
    });
    return true;
  }

  update(play) {
    this.glow++;
    if (this.glow % 40 === 0) play.particles.spawn('sparkle', this.cx, this.y, 1);
  }

  draw(ctx, cam) {
    this.drawSpriteAnchored(ctx, cam, 'save_statue');
  }
}

// ---------------- Pot (breakable) ----------------
export class Pot extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 4, 12, 11);
    this.solid = true;
    this.isCuttable = true;
  }

  onSword(play) {
    this.dead = true;
    sfx('clink');
    play.particles.spawn('stone', this.cx, this.cy, 8);
    rollDrop(play, this.cx, this.cy);
  }

  draw(ctx, cam) {
    this.drawSpriteAnchored(ctx, cam, 'pot', { yOff: 2 });
  }
}

// ---------------- Doors ----------------
// kind: 'locked' (small key) | 'boss' (boss key) | 'shutter' (channel/cleared)
export class Door extends Entity {
  constructor(def) {
    super(def.x * TILE, def.y * TILE, TILE, TILE);
    this.id = def.id;
    this.kind = def.kind || 'locked';
    this.channel = def.channel || null; // for shutters
    this.solid = true;
    this.open = false;
  }

  enter(play) {
    if (this.id && play.isOpened(this.id)) this.openUp(play, true);
    // shutters with a channel start closed; cleared-shutters open if no enemies
    if (this.kind === 'shutter' && !this.channel && !play.hasLivingEnemies()) {
      this.openUp(play, true);
    }
  }

  openUp(play, silent = false) {
    if (this.open) return;
    this.open = true;
    this.solid = false;
    if (!silent) sfx('doorOpen');
  }

  interact(play) {
    if (this.open) return false;
    if (this.kind === 'locked') {
      if (play.useKey()) {
        this.openUp(play);
        if (this.id) play.markOpened(this.id);
      } else {
        play.say('Locked tight. A small key would open it.');
      }
      return true;
    }
    if (this.kind === 'boss') {
      if (play.hasBossKey()) {
        this.openUp(play);
        if (this.id) play.markOpened(this.id);
        sfx('secret');
      } else {
        play.say('A great seal bars the way. It hungers for the Master Key of this place.');
      }
      return true;
    }
    return false;
  }

  update(play) {
    if (this.open) return;
    if (this.kind === 'shutter') {
      const opened = this.channel ? play.channelActive(this.channel) : !play.hasLivingEnemies();
      if (opened) this.openUp(play);
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    if (this.open) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + 2, y + 2, 12, 14);
      return;
    }
    const body = this.kind === 'boss' ? C.purpleDark : this.kind === 'locked' ? C.stoneDark : C.brownDark;
    ctx.fillStyle = body;
    ctx.fillRect(x + 1, y, 14, 16);
    ctx.fillStyle = this.kind === 'boss' ? C.purple : this.kind === 'locked' ? C.stone : C.brown;
    ctx.fillRect(x + 2, y + 1, 12, 14);
    if (this.kind !== 'shutter') {
      ctx.fillStyle = C.yellow;
      ctx.fillRect(x + 6, y + 6, 4, 4);
      ctx.fillStyle = C.black;
      ctx.fillRect(x + 7, y + 8, 2, 3);
    } else {
      ctx.fillStyle = C.black;
      for (let i = 0; i < 3; i++) ctx.fillRect(x + 3, y + 3 + i * 4, 10, 2);
    }
  }
}

// ---------------- Floor switch ----------------
export class FloorSwitch extends Entity {
  constructor(def) {
    super(def.x * TILE + 3, def.y * TILE + 3, 10, 10);
    this.channel = def.channel;
    this.latch = def.latch !== false; // stays pressed once triggered
    this.pressed = false;
    this.canCross = true;
  }

  update(play) {
    const on = aabbOverlap(this.box, play.player.box) ||
      play.entities.some(e => e.weighty && !e.dead && aabbOverlap(this.box, e.box));
    if (on && !this.pressed) {
      this.pressed = true;
      play.setChannel(this.channel, true);
      sfx('switch');
    } else if (!on && this.pressed && !this.latch) {
      this.pressed = false;
      play.setChannel(this.channel, false);
    }
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    ctx.fillStyle = this.pressed ? C.grayDark : C.stoneLight;
    ctx.fillRect(x, y, 10, 10);
    ctx.fillStyle = this.pressed ? C.black : C.grayDark;
    ctx.fillRect(x + 2, y + 2, 6, 6);
  }
}

// ---------------- Crystal switch (hit with sword/boomerang/arrow) ----------------
export class CrystalSwitch extends Entity {
  constructor(def) {
    super(def.x * TILE + 4, def.y * TILE + 4, 8, 10);
    this.channel = def.channel;
    this.on = false;
    this.solid = true;
    this.cool = 0;
  }

  onSword(play) { this.toggle(play); }
  onRanged(play) { this.toggle(play); }

  toggle(play) {
    if (this.cool > 0) return;
    this.cool = 20;
    this.on = !this.on;
    play.setChannel(this.channel, this.on);
    sfx('switch');
    play.particles.spawn('sparkle', this.cx, this.cy, 6);
  }

  update() { if (this.cool > 0) this.cool--; }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    ctx.fillStyle = C.grayDark;
    ctx.fillRect(x, y + 8, 8, 4);
    ctx.fillStyle = this.on ? C.red : C.blue;
    ctx.fillRect(x + 1, y + 2, 6, 7);
    ctx.fillRect(x + 2, y, 4, 2);
    ctx.fillStyle = this.on ? '#f0a0a0' : '#a0c8f0';
    ctx.fillRect(x + 2, y + 2, 2, 3);
  }
}

// ---------------- Eye switch (arrow only) ----------------
export class EyeSwitch extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 2, 12, 12);
    this.channel = def.channel;
    this.on = false;
    this.solid = true;
  }

  onArrow(play) {
    if (this.on) return;
    this.on = true;
    play.setChannel(this.channel, true);
    sfx('secret');
    play.particles.spawn('sparkle', this.cx, this.cy, 8);
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    ctx.fillStyle = C.stoneDark;
    ctx.fillRect(x, y, 12, 12);
    ctx.fillStyle = this.on ? C.redDark : C.white;
    ctx.fillRect(x + 2, y + 3, 8, 6);
    ctx.fillStyle = this.on ? C.black : C.blueDark;
    ctx.fillRect(x + 5, y + 4, 3, 4);
  }
}

// ---------------- Torch ----------------
export class Torch extends Entity {
  constructor(def) {
    super(def.x * TILE + 4, def.y * TILE + 6, 8, 8);
    this.lit = !!def.lit;
    this.channel = def.channel || null; // all torches with same channel lit -> on
    this.solid = true;
    this.isTorch = true;
  }

  light(play) {
    if (this.lit) return;
    this.lit = true;
    sfx('burn');
    play.particles.spawn('ember', this.cx, this.cy - 4, 8);
    if (this.channel) {
      const torches = play.entities.filter(e => e.isTorch && e.channel === this.channel);
      if (torches.every(t => t.lit)) {
        play.setChannel(this.channel, true);
        sfx('secret');
      }
    }
  }

  draw(ctx, cam) {
    const name = this.lit ? (Math.floor(performance.now() / 160) % 2 ? 'torch_lit_0' : 'torch_lit_1') : 'torch_unlit';
    this.drawSpriteAnchored(ctx, cam, name, { yOff: 3 });
  }
}

// ---------------- Push block ----------------
export class PushBlock extends Entity {
  constructor(def) {
    super(def.x * TILE, def.y * TILE, TILE, TILE);
    this.solid = true;
    this.weighty = true;
    this.pushT = 0;
    this.moving = null;
    this.moved = def.once === false ? Infinity : 1; // pushes remaining
  }

  update(play) {
    if (this.moving) {
      const [dx, dy] = this.moving;
      this.x += dx;
      this.y += dy;
      this.dist -= 1;
      if (this.dist <= 0) {
        this.moving = null;
        this.x = Math.round(this.x / TILE) * TILE;
        this.y = Math.round(this.y / TILE) * TILE;
      }
      return;
    }
    if (this.moved <= 0) return;
    // player leaning into the block?
    const p = play.player;
    const v = play.game.input.dirVector();
    const touching = aabbOverlap(
      { x: this.x - 1, y: this.y - 1, w: this.w + 2, h: this.h + 2 }, p.box);
    if (touching && (v.x || v.y) && this._towardMe(p, v)) {
      this.pushT++;
      if (this.pushT > 20) {
        const dx = Math.abs(v.x) > Math.abs(v.y) ? Math.sign(v.x) : 0;
        const dy = dx === 0 ? Math.sign(v.y) : 0;
        const tx = Math.round(this.x / TILE) + dx;
        const ty = Math.round(this.y / TILE) + dy;
        const f = play.map.flagsAt(tx, ty);
        const occupied = play.entities.some(e =>
          e !== this && e.solid && !e.dead &&
          aabbOverlap({ x: tx * TILE + 2, y: ty * TILE + 2, w: 12, h: 12 }, e.box));
        if (!f.solid && !f.water && !f.lava && !f.pit && !occupied) {
          this.moving = [dx, dy];
          this.dist = TILE;
          this.moved--;
          this.pushT = 0;
          sfx('stairs');
        } else {
          this.pushT = 0;
        }
      }
    } else {
      this.pushT = 0;
    }
  }

  _towardMe(p, v) {
    if (v.x > 0) return p.cx < this.x;
    if (v.x < 0) return p.cx > this.x + this.w;
    if (v.y > 0) return p.cy < this.y;
    if (v.y < 0) return p.cy > this.y + this.h;
    return false;
  }

  draw(ctx, cam) {
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    ctx.fillStyle = C.stone;
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = C.stoneLight;
    ctx.fillRect(x, y, 16, 2);
    ctx.fillRect(x, y, 2, 16);
    ctx.fillStyle = C.stoneDark;
    ctx.fillRect(x + 14, y, 2, 16);
    ctx.fillRect(x, y + 14, 16, 2);
    ctx.fillStyle = C.grayDark;
    ctx.fillRect(x + 5, y + 5, 6, 6);
  }
}

// ---------------- Warp trigger ----------------
export class Warp extends Entity {
  constructor(def) {
    super(def.x * TILE + 2, def.y * TILE + 2, (def.w || 1) * TILE - 4, (def.h || 1) * TILE - 4);
    this.to = def.to; // {map, x, y} in tiles
    this.kind = def.kind || 'walk';
    this.requireFlag = def.requireFlag || null;
    this.deniedText = def.deniedText || null;
    this.canCross = true;
    this.invisible = true;
  }

  update(play) {
    if (aabbOverlap(this.box, play.player.box)) {
      if (this.requireFlag && !play.hasFlag(this.requireFlag)) {
        if (this.deniedText && !this._said) {
          this._said = true;
          play.say(this.deniedText);
          // push player back a step
          play.player.y += play.player.cy < this.cy ? -4 : 4;
        }
        return;
      }
      if (this.kind === 'stairs' || this.kind === 'door') sfx('stairs');
      play.changeMap(this.to.map, this.to.x, this.to.y);
    } else {
      this._said = false;
    }
  }

  draw() { /* invisible */ }
}

// ---------------- Gate (channel-controlled barrier) ----------------
export class Gate extends Entity {
  constructor(def) {
    super(def.x * TILE, def.y * TILE, (def.w || 1) * TILE, (def.h || 1) * TILE);
    this.channel = def.channel;
    this.invert = !!def.invert;
    this.solid = true;
  }

  update(play) {
    const active = play.channelActive(this.channel);
    const open = this.invert ? !active : active;
    if (open && this.solid) {
      this.solid = false;
      sfx('doorOpen');
      play.particles.spawn('stone', this.cx, this.cy, 8);
    } else if (!open && !this.solid) {
      this.solid = true;
    }
  }

  draw(ctx, cam) {
    if (!this.solid) return;
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    ctx.fillStyle = C.grayDark;
    for (let ix = 0; ix < this.w; ix += 6) {
      ctx.fillRect(x + ix + 2, y, 3, this.h);
    }
    ctx.fillStyle = C.stoneLight;
    ctx.fillRect(x, y + 1, this.w, 2);
    ctx.fillRect(x, y + this.h - 3, this.w, 2);
  }
}

// ---------------- Heart piece ----------------
export class HeartPiece extends Entity {
  constructor(def) {
    super(def.x * TILE + 3, def.y * TILE + 3, 10, 10);
    this.id = def.id;
    this.canCross = true;
    this.bob = 0;
  }

  enter(play) {
    if (play.isOpened(this.id)) this.dead = true;
  }

  update(play) {
    this.bob++;
    if (aabbOverlap(this.box, play.player.box)) {
      this.dead = true;
      play.markOpened(this.id);
      play.giveContents('heartpiece', this.cx, this.cy);
    }
  }

  draw(ctx, cam) {
    const yOff = Math.round(Math.sin(this.bob / 14) * 2) - 3;
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y) + yOff;
    ctx.fillStyle = C.red;
    ctx.fillRect(x + 2, y, 6, 7);
    ctx.fillRect(x, y + 2, 10, 3);
    ctx.fillStyle = C.white;
    ctx.fillRect(x + 3, y + 1, 2, 2);
  }
}
