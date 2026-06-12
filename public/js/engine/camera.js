// Follow camera clamped to map bounds, with screen shake.

import { VIEW_W, VIEW_H } from './renderer.js';

const HUD_H = 24; // top HUD strip; playfield is below it

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.viewW = VIEW_W;
    this.viewH = VIEW_H - HUD_H;
    this.shakeTime = 0;
    this.shakeMag = 0;
  }

  follow(target, map) {
    let x = target.x + target.w / 2 - this.viewW / 2;
    let y = target.y + target.h / 2 - this.viewH / 2;
    this.x = clamp(x, 0, Math.max(0, map.pixelW - this.viewW));
    this.y = clamp(y, 0, Math.max(0, map.pixelH - this.viewH));
    // Center small maps
    if (map.pixelW < this.viewW) this.x = (map.pixelW - this.viewW) / 2;
    if (map.pixelH < this.viewH) this.y = (map.pixelH - this.viewH) / 2;
    if (this.shakeTime > 0) {
      this.shakeTime--;
      this.x += (Math.random() - 0.5) * this.shakeMag;
      this.y += (Math.random() - 0.5) * this.shakeMag;
    }
  }

  shake(frames, mag = 3) {
    this.shakeTime = frames;
    this.shakeMag = mag;
  }
}

export { HUD_H };

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
