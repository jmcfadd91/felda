// Drops and collectibles: hearts, gems, arrows, bombs, keys.

import { Entity } from '../engine/entity.js';
import { aabbOverlap } from '../engine/physics.js';
import { sfx } from '../audio/sfx.js';

const KINDS = {
  heart: { sprite: 'heart', life: 600 },
  gem1: { sprite: 'gem_green', life: 600 },
  gem5: { sprite: 'gem_blue', life: 600 },
  gem20: { sprite: 'gem_red', life: 600 },
  arrows: { sprite: 'arrow_pickup', life: 600 },
  bomb: { sprite: 'bomb_pickup', life: 600 },
  key: { sprite: 'key_small', life: Infinity },
};

export class Pickup extends Entity {
  constructor(kind, x, y) {
    super(x, y, 8, 8);
    this.kind = kind;
    this.def = KINDS[kind];
    this.isPickup = true;
    this.carried = false;
    this.life = this.def.life;
    this.bob = Math.random() * 60;
    this.canCross = true;
  }

  update(play) {
    this.bob++;
    if (this.life !== Infinity && --this.life <= 0) this.dead = true;
    if (aabbOverlap(this.box, play.player.box)) this.collect(play);
  }

  collect(play) {
    const st = play.state;
    switch (this.kind) {
      case 'heart': play.player.heal(1); sfx('heart'); break;
      case 'gem1': st.gems = Math.min(999, st.gems + 1); sfx('gem'); break;
      case 'gem5': st.gems = Math.min(999, st.gems + 5); sfx('gem'); break;
      case 'gem20': st.gems = Math.min(999, st.gems + 20); sfx('gem'); break;
      case 'arrows': st.arrows = Math.min(st.arrowsMax, st.arrows + 5); sfx('gem'); break;
      case 'bomb': st.bombs = Math.min(st.bombsMax, st.bombs + 3); sfx('gem'); break;
      case 'key': play.gainKey(); sfx('key'); break;
    }
    play.particles.spawn('sparkle', this.cx, this.cy, 4);
    this.dead = true;
  }

  draw(ctx, cam) {
    if (this.life < 120 && this.life % 6 < 3) return; // expiring flicker
    const yOff = Math.round(Math.sin(this.bob / 12) * 1.5) - 2;
    this.drawSpriteAnchored(ctx, cam, this.def.sprite, { yOff });
  }
}

// Weighted drop table; low health biases hearts (classic kindness).
export function rollDrop(play, x, y) {
  const st = play.state;
  const lowHp = st.hearts <= st.heartsMax * 0.34;
  const r = Math.random();
  let kind = null;
  if (r < (lowHp ? 0.38 : 0.16)) kind = 'heart';
  else if (r < 0.5) kind = 'gem1';
  else if (r < 0.58) kind = 'gem5';
  else if (r < 0.64 && st.items.includes('bow')) kind = 'arrows';
  else if (r < 0.7 && st.items.includes('bombs')) kind = 'bomb';
  if (kind) play.spawn(new Pickup(kind, x - 4, y - 4));
}
