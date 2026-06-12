// Canvas setup: fixed 320x240 virtual resolution, integer-scaled to the
// window with letterboxing, crisp pixels.

export const VIEW_W = 320;
export const VIEW_H = 240;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this._fit();
    addEventListener('resize', () => this._fit());
  }

  _fit() {
    const scale = Math.max(1, Math.floor(Math.min(
      innerWidth / VIEW_W, innerHeight / VIEW_H)));
    this.canvas.style.width = `${VIEW_W * scale}px`;
    this.canvas.style.height = `${VIEW_H * scale}px`;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}
