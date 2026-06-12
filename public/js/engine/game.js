// Fixed-timestep game loop with a scene stack. Scenes implement:
//   update(game)   - one 60 Hz tick (only topmost updating scene runs,
//                    unless scene.transparentUpdate lets the one below run too)
//   draw(game, ctx) - scenes below a transparent scene still draw (pause menus)
//   enter()/exit() - optional lifecycle hooks

import { Input } from './input.js';
import { Renderer } from './renderer.js';

const STEP = 1 / 60;
const MAX_STEPS = 5;

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.scenes = [];
    this._acc = 0;
    this._last = 0;
    this.ticks = 0; // global tick counter for animation timing
  }

  push(scene) { this.scenes.push(scene); scene.enter?.(this); }
  pop() { const s = this.scenes.pop(); s?.exit?.(this); return s; }
  replace(scene) { while (this.scenes.length) this.pop(); this.push(scene); }
  get top() { return this.scenes[this.scenes.length - 1]; }

  start() {
    this._last = performance.now();
    const frame = (now) => {
      this._acc += Math.min((now - this._last) / 1000, 0.25);
      this._last = now;
      let steps = 0;
      while (this._acc >= STEP && steps < MAX_STEPS) {
        this.input.poll();
        this._update();
        this._acc -= STEP;
        steps++;
        this.ticks++;
      }
      if (steps === MAX_STEPS) this._acc = 0; // dropped frames: don't spiral
      this._draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  _update() {
    const top = this.top;
    if (!top) return;
    top.update?.(this);
    // Allow e.g. weather/animation below a transparent overlay.
    if (top.transparentUpdate) {
      const below = this.scenes[this.scenes.length - 2];
      below?.update?.(this);
    }
  }

  _draw() {
    const ctx = this.renderer.ctx;
    this.renderer.clear();
    // Find the lowest scene that must draw (walk down past transparent ones).
    let start = this.scenes.length - 1;
    while (start > 0 && this.scenes[start].transparentDraw) start--;
    for (let i = start; i < this.scenes.length; i++) {
      this.scenes[i].draw?.(this, ctx);
    }
  }
}
