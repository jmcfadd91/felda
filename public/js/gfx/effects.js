// Particle pool: sparkles, leaf puffs, smoke, splashes, explosions.

import { COLORS as C } from './palette.js';

export class Particles {
  constructor() {
    this.list = [];
  }

  spawn(kind, x, y, count = 6) {
    const defs = {
      sparkle: { colors: [C.white, C.yellow], life: 24, speed: 0.5, gravity: 0 },
      leaf: { colors: [C.green, C.greenDark, C.grassLight], life: 30, speed: 1.0, gravity: 0.04 },
      smoke: { colors: [C.gray, C.grayDark, C.white], life: 28, speed: 0.7, gravity: -0.02 },
      splash: { colors: [C.water, C.waterLight, C.white], life: 22, speed: 1.2, gravity: 0.08 },
      boom: { colors: [C.yellow, C.orange, C.red, C.gray], life: 26, speed: 1.8, gravity: 0 },
      ember: { colors: [C.lava, C.lavaLight, C.yellow], life: 26, speed: 0.9, gravity: -0.03 },
      dark: { colors: [C.purple, C.purpleDark, C.black], life: 26, speed: 0.9, gravity: 0 },
      heartburst: { colors: [C.red, C.white], life: 30, speed: 1.0, gravity: -0.02 },
      stone: { colors: [C.stone, C.stoneDark], life: 24, speed: 1.3, gravity: 0.1 },
    };
    const d = defs[kind] || defs.sparkle;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = d.speed * (0.4 + Math.random() * 0.8);
      this.list.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - d.speed * 0.3,
        life: d.life * (0.7 + Math.random() * 0.5),
        maxLife: d.life,
        color: d.colors[Math.floor(Math.random() * d.colors.length)],
        gravity: d.gravity,
        size: Math.random() < 0.3 ? 2 : 1,
      });
    }
  }

  update() {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.96;
      if (--p.life <= 0) this.list.splice(i, 1);
    }
  }

  draw(ctx, cam) {
    for (const p of this.list) {
      if (p.life < p.maxLife * 0.3 && p.life % 3 === 0) continue; // fade flicker
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.size, p.size);
    }
  }
}
