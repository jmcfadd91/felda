// Base entity: position/velocity AABB with hp, hurt flashes, and knockback.
// Subclasses override update()/draw(). Coordinates are world pixels;
// (x, y) is the top-left of the collision box.

import { drawSprite, getSprite } from '../gfx/sprites.js';

export class Entity {
  constructor(x, y, w = 12, h = 12) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.hp = 1;
    this.maxHp = 1;
    this.dir = 'down';
    this.iframes = 0;
    this.knockX = 0;
    this.knockY = 0;
    this.knockTime = 0;
    this.dead = false;
    this.solid = false;      // blocks movement of others
    this.hurtsPlayer = 0;    // contact damage
    this.zLayer = 0;         // draw order bias added to y-sort
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get box() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

  hurt(dmg, fromX, fromY, knock = 2.2) {
    if (this.iframes > 0 || this.dead) return false;
    this.hp -= dmg;
    this.iframes = this.hurtIframes ?? 15;
    const dx = this.cx - fromX;
    const dy = this.cy - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.knockX = (dx / len) * knock;
    this.knockY = (dy / len) * knock;
    this.knockTime = 10;
    if (this.hp <= 0) this.die?.();
    return true;
  }

  baseTick() {
    if (this.iframes > 0) this.iframes--;
    if (this.knockTime > 0) this.knockTime--;
  }

  get knocked() { return this.knockTime > 0; }

  // Skip-draw flicker during iframes.
  get visible() { return this.iframes <= 0 || this.iframes % 4 < 2; }

  drawShadow(ctx, cam) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(Math.round(this.x - cam.x), Math.round(this.y + this.h - 2 - cam.y), this.w, 3);
  }

  // Convenience: draw a 16x16 sprite centered on the hitbox, feet-anchored.
  drawSpriteAnchored(ctx, cam, name, opts = {}) {
    const s = getSprite(name, opts);
    const dx = Math.round(this.x + this.w / 2 - s.width / 2 - cam.x);
    const dy = Math.round(this.y + this.h - s.height - cam.y) + (opts.yOff || 0);
    ctx.drawImage(s, dx, dy);
  }

  update(/* play */) {}
  draw(ctx, cam) {
    if (!this.visible) return;
    this.drawSpriteAnchored(ctx, cam, 'pot');
  }
}
