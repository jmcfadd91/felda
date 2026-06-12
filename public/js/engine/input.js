// Action-mapped input: keyboard + virtual touch controls set the same flags,
// so game code never cares about the device.

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyJ: 'a', KeyZ: 'a', Space: 'a',
  KeyK: 'b', KeyX: 'b',
  KeyE: 'interact', Enter: 'interact',
  Escape: 'pause', KeyP: 'pause',
  KeyM: 'map',
};

export class Input {
  // When true (text fields in menus), action mapping is suspended and the
  // capturing UI handles raw keydown events itself.
  static textCapture = false;

  constructor() {
    this.down = {};       // currently held
    this.pressed = {};    // went down this frame
    this._queue = [];     // edge events between frames
    this.anyKey = false;  // any press this frame (title screens, audio unlock)

    addEventListener('keydown', (e) => {
      if (Input.textCapture || e.repeat) return;
      const act = KEYMAP[e.code];
      this._queue.push(['any']);
      if (!act) return;
      e.preventDefault();
      if (!this.down[act]) this._queue.push(['press', act]);
      this.down[act] = true;
    });
    addEventListener('keyup', (e) => {
      const act = KEYMAP[e.code];
      if (act) this.down[act] = false;
    });
    addEventListener('blur', () => { this.down = {}; });

    this._initTouch();
  }

  _initTouch() {
    const ui = document.getElementById('touch-ui');
    if (!ui) return;
    addEventListener('touchstart', () => { ui.hidden = false; }, { once: true, passive: true });
    for (const btn of ui.querySelectorAll('button')) {
      const act = btn.dataset.act;
      const press = (e) => {
        e.preventDefault();
        this._queue.push(['any']);
        if (!this.down[act]) this._queue.push(['press', act]);
        this.down[act] = true;
      };
      const release = (e) => { e.preventDefault(); this.down[act] = false; };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    }
  }

  // Called once per fixed update tick.
  poll() {
    this.pressed = {};
    this.anyKey = false;
    for (const ev of this._queue) {
      if (ev[0] === 'any') this.anyKey = true;
      else this.pressed[ev[1]] = true;
    }
    this._queue.length = 0;
  }

  held(act) { return !!this.down[act]; }
  justPressed(act) { return !!this.pressed[act]; }

  // Cardinal direction vector from held keys.
  dirVector() {
    let x = 0, y = 0;
    if (this.down.left) x -= 1;
    if (this.down.right) x += 1;
    if (this.down.up) y -= 1;
    if (this.down.down) y += 1;
    return { x, y };
  }
}
