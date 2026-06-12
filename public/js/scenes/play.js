// The main gameplay scene: owns the live map, player, entities, particles,
// combat resolution, map transitions, checkpoints, and the HUD.

import { Tilemap, getMapDef, TILE } from '../engine/tilemap.js';
import { Camera, HUD_H } from '../engine/camera.js';
import { VIEW_W, VIEW_H } from '../engine/renderer.js';
import { aabbOverlap } from '../engine/physics.js';
import { Player } from '../entities/player.js';
import { createEntity } from '../entities/index.js';
import { Pickup, rollDrop } from '../entities/pickups.js';
import { Particles } from '../gfx/effects.js';
import { drawHud } from '../ui/hud.js';
import { DialogScene } from '../ui/dialog.js';
import { drawTextCentered } from '../ui/textrender.js';
import { hasFlag, setFlag, dungeonState, persist } from '../engine/save.js';
import { audio } from '../audio/audio.js';
import { sfx } from '../audio/sfx.js';
import { getSprite } from '../gfx/sprites.js';

export class PlayScene {
  constructor(state, slot) {
    this.state = state;
    this.slot = slot;
    this.camera = new Camera();
    this.particles = new Particles();
    this.entities = [];
    this.channels = new Set();
    this.fade = 30;          // fade-in frames
    this.fadeDir = -1;
    this.pendingMap = null;
    this.banner = 0;
    this.bannerText = '';
    this.player = new Player(state.checkpoint.x, state.checkpoint.y, state);
    this._spawnQueue = [];
    this.cutsceneLock = 0;
    this.onCutscene = null;
  }

  enter(game) {
    this.game = game;
    this.loadMap(this.state.checkpoint.map, null, null, true);
  }

  // ---------------- map management ----------------

  loadMap(id, tx, ty, instant = false) {
    const def = getMapDef(id);
    this.map = new Tilemap(def);
    this.mapDef = def;
    this.dungeonId = def.dungeon || null;
    this.entities = [];
    this.channels = new Set();
    this.particles.list.length = 0;
    if (tx !== null && tx !== undefined) {
      this.player.x = tx * TILE + (TILE - this.player.w) / 2;
      this.player.y = ty * TILE + (TILE - this.player.h) / 2;
    }
    this.player.rememberSafeSpot();
    for (const d of def.entities || []) {
      if (d.when && !d.when(this.state)) continue;
      if (d.unlessFlag && hasFlag(this.state, d.unlessFlag)) continue;
      if (d.ifFlag && !hasFlag(this.state, d.ifFlag)) continue;
      const e = createEntity(d, this);
      if (e) {
        this.entities.push(e);
        e.enter?.(this);
      }
    }
    const theme = this.duskActive() && def.duskMusic ? def.duskMusic
      : this.duskActive() && def.outdoor ? 'dusk' : def.music;
    if (theme) audio.playSong(theme);
    if (def.name && !instant) {
      this.banner = 110;
      this.bannerText = def.name;
    }
    def.onEnter?.(this);
  }

  duskActive() { return this.state.duskfall && this.mapDef?.outdoor; }

  changeMap(id, tx, ty) {
    if (this.pendingMap) return;
    this.pendingMap = { id, tx, ty };
    this.fadeDir = 1;
  }

  // ---------------- state helpers ----------------

  hasFlag(f) { return hasFlag(this.state, f); }
  setFlag(f) { setFlag(this.state, f); }

  dungeon() { return this.dungeonId ? dungeonState(this.state, this.dungeonId) : null; }
  dungeonKeys() { return this.dungeon()?.keys ?? 0; }
  gainKey() { const d = this.dungeon(); if (d) d.keys++; }
  useKey() {
    const d = this.dungeon();
    if (d && d.keys > 0) { d.keys--; return true; }
    return false;
  }
  hasBossKey() { return !!this.dungeon()?.bossKey; }

  isOpened(id) {
    if (!id) return false;
    const d = this.dungeon();
    return d ? d.opened.includes(id) || this.state.openedChests.includes(id)
      : this.state.openedChests.includes(id);
  }

  markOpened(id) {
    if (!id) return;
    const d = this.dungeon();
    const list = d ? d.opened : this.state.openedChests;
    if (!list.includes(id)) list.push(id);
  }

  channelActive(c) { return this.channels.has(c); }
  setChannel(c, on) { if (on) this.channels.add(c); else this.channels.delete(c); }

  hasLivingEnemies() {
    return this.entities.some(e => e.isEnemy && !e.dead && !e.noShutterCount);
  }

  // ---------------- spawning / lists ----------------

  spawn(e) { this._spawnQueue.push(e); }

  solidEntities() {
    return this.entities.filter(e => e.solid && !e.dead);
  }

  // ---------------- dialog / cutscene ----------------

  say(pages, opts = {}) {
    this.game.push(new DialogScene(pages, opts));
  }

  // ---------------- combat resolution ----------------

  hitWithSword(box, dmg, player) {
    for (const e of this.entities) {
      if (e.dead) continue;
      if (!aabbOverlap(box, e.box)) continue;
      if (e.isEnemy) {
        if (player.swordHits.has(e)) continue;
        if (e.swordImmune?.(player, this)) { sfx('clink'); player.swordHits.add(e); continue; }
        if (e.hurt(dmg, player.cx, player.cy)) {
          player.swordHits.add(e);
          sfx('hit');
        }
      } else if (e.onSword && !player.swordHits.has(e)) {
        player.swordHits.add(e);
        e.onSword(this, player);
      }
    }
    // cuttable tiles
    this._forTilesIn(box, (tx, ty, f) => {
      if (f.cuttable) this.cutBushAt(tx, ty);
    });
  }

  hitWithBlast(box, dmg) {
    for (const e of this.entities) {
      if (e.dead || !aabbOverlap(box, e.box)) continue;
      if (e.onBlast) e.onBlast(this);
      else if (e.isEnemy) e.hurt(dmg, box.x + box.w / 2, box.y + box.h / 2);
    }
    if (aabbOverlap(box, this.player.box)) {
      this.player.takeDamage(this, 1, box.x + box.w / 2, box.y + box.h / 2);
    }
    this._forTilesIn(box, (tx, ty, f) => {
      if (f.cuttable) this.cutBushAt(tx, ty);
    });
  }

  boomerangTouch(box) {
    let hit = false;
    for (const e of this.entities) {
      if (e.dead || !aabbOverlap(box, e.box)) continue;
      if (e.isEnemy && !e.stunImmune) {
        if (e.stunned <= 0) {
          e.stunned = 90;
          sfx('hit');
        }
        hit = true;
      } else if (e.onRanged) {
        e.onRanged(this);
        hit = true;
      }
    }
    return hit;
  }

  arrowTouch(box, dmg) {
    for (const e of this.entities) {
      if (e.dead || !aabbOverlap(box, e.box)) continue;
      if (e.isEnemy) {
        if (e.hurt(dmg, box.x, box.y)) { sfx('hit'); return true; }
      } else if (e.onArrow) {
        e.onArrow(this);
        return true;
      } else if (e.onRanged) {
        e.onRanged(this);
        return true;
      } else if (e.solid) {
        return true;
      }
    }
    return false;
  }

  cutBushAt(tx, ty) {
    this.map.cutBush(tx, ty);
    this.particles.spawn('leaf', tx * TILE + 8, ty * TILE + 8, 8);
    sfx('hit');
    if (Math.random() < 0.25) rollDrop(this, tx * TILE + 8, ty * TILE + 8);
  }

  bombWallAt(tx, ty) {
    const reveal = this.mapDef.bombReveal?.[`${tx},${ty}`] || '.';
    this.map.setTile(tx, ty, reveal);
    this.particles.spawn('stone', tx * TILE + 8, ty * TILE + 8, 10);
    sfx('secret');
  }

  _forTilesIn(box, fn) {
    const x0 = Math.floor(box.x / TILE);
    const y0 = Math.floor(box.y / TILE);
    const x1 = Math.floor((box.x + box.w) / TILE);
    const y1 = Math.floor((box.y + box.h) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        fn(tx, ty, this.map.flagsAt(tx, ty));
      }
    }
  }

  // ---------------- rewards ----------------

  giveContents(contents, x, y) {
    const [kind, arg] = String(contents).split(':');
    const st = this.state;
    switch (kind) {
      case 'gems': {
        const n = Number(arg) || 5;
        st.gems = Math.min(999, st.gems + n);
        this.say(`You found ${n} gems!`);
        break;
      }
      case 'key': this.gainKey(); this.say('You found a small key!'); break;
      case 'bosskey': {
        const d = this.dungeon();
        if (d) d.bossKey = true;
        this.say('You claimed the Master Key! The great seal of this place can now be broken.');
        sfx('fanfare');
        break;
      }
      case 'map': {
        const d = this.dungeon();
        if (d) d.map = true;
        this.say('You found the map! Check it from the pause menu.');
        break;
      }
      case 'compass': {
        const d = this.dungeon();
        if (d) d.compass = true;
        this.say('You found the compass! The lair of this place\'s master is revealed.');
        break;
      }
      case 'heartpiece': {
        st.heartPieces++;
        sfx('fanfare');
        if (st.heartPieces >= 4) {
          st.heartPieces -= 4;
          st.heartsMax++;
          st.hearts = st.heartsMax;
          this.say('You completed a Heart Vessel! Your life force grows.');
        } else {
          this.say(`You found a Heart Shard! Collect ${4 - st.heartPieces} more to grow your life force.`);
        }
        break;
      }
      case 'heartcontainer': {
        st.heartsMax++;
        st.hearts = st.heartsMax;
        sfx('fanfare');
        this.say('A Heart Vessel! Your life force grows.');
        break;
      }
      case 'bombs': {
        st.bombs = Math.min(st.bombsMax, st.bombs + (Number(arg) || 5));
        this.say(`You found ${arg || 5} bombs!`);
        break;
      }
      case 'arrows': {
        st.arrows = Math.min(st.arrowsMax, st.arrows + (Number(arg) || 10));
        this.say(`You found ${arg || 10} arrows!`);
        break;
      }
      case 'potion': {
        st.bottlePotion = true;
        this.say('Your bottle now brims with crimson potion! Use it from the B slot to restore all hearts.');
        break;
      }
      case 'item': this.acquireItem(arg); break;
      default: break;
    }
  }

  acquireItem(item, text = null) {
    const st = this.state;
    if (!st.items.includes(item)) st.items.push(item);
    if (item === 'bombs' && st.bombs === 0) st.bombs = 8;
    if (item === 'bow' && st.arrows === 0) st.arrows = 15;
    if (item === 'sword' && st.swordLevel === 0) st.swordLevel = 1;
    if (!st.equippedB && item !== 'sword') st.equippedB = item;
    sfx('fanfare');
    const names = {
      sword: 'the Glade Sword! Press A to swing it. Hold A to charge a spin attack',
      galewing: 'the Galewing! Equip it to B and hurl it to stun foes, cut vines, and fetch faraway things',
      bombs: 'a satchel of Bombs! Equip them to B to blast cracked stone',
      grapple: 'the Grapple Fang! Equip it to B to latch onto stumps and rings and pull yourself across',
      bow: 'the Sylvan Bow! Equip it to B to strike distant eyes and foes',
      whistle: 'the Whistle of Eras! Equip it to B and play the melodies of the old kingdom',
      bottle: 'an empty Bottle! Fill it with potion at the town shop',
      sword2: 'the Embertide Blade! Your strikes now carry the relics\' fire',
    };
    if (item === 'sword2') st.swordLevel = 2;
    this.say(text || `You received ${names[item] || item}!`, { speaker: 'TREASURE' });
  }

  // ---------------- saving ----------------

  checkpointHere() {
    this.state.checkpoint = {
      map: this.map.id,
      x: Math.round(this.player.x),
      y: Math.round(this.player.y),
    };
    persist(this.slot, this.state);
  }

  autosave() {
    this.checkpointHere();
  }

  gameOver() {
    audio.stopSong();
    import('./gameover.js').then(({ GameOverScene }) => {
      this.game.push(new GameOverScene(this));
    });
  }

  openWhistle() {
    import('../story/melodies.js').then(({ WhistleScene }) => {
      this.game.push(new WhistleScene(this));
    });
  }

  learnMelody(id) {
    if (!this.state.melodies.includes(id)) this.state.melodies.push(id);
    sfx('melodyOk');
    import('../story/melodies.js').then(({ MELODIES }) => {
      const m = MELODIES[id];
      const arrows = { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT' };
      this.say(`You learned ${m.name}! (${m.notes.map(n => arrows[n]).join(', ')})`, { speaker: 'MELODY' });
    });
    this.autosave();
  }

  startDuskfall() {
    this.state.duskfall = true;
    this.setFlag('duskfall_seen');
    this.camera.shake(40, 2);
    sfx('bossRoar');
    this.autosave();
  }

  resumeMusic() {
    const def = this.mapDef;
    const theme = this.duskActive() && def.duskMusic ? def.duskMusic
      : this.duskActive() && def.outdoor ? 'dusk' : def.music;
    if (theme) audio.playSong(theme);
  }

  openShop() {
    import('../ui/menus.js').then(({ ShopScene }) => {
      this.game.push(new ShopScene(this));
    });
  }

  openPause() {
    import('../ui/menus.js').then(({ PauseScene }) => {
      this.game.push(new PauseScene(this));
    });
  }

  // ---------------- interaction ----------------

  _tryInteract() {
    const box = this.player.probeBox();
    for (const e of this.entities) {
      if (e.dead || !e.interact) continue;
      if (aabbOverlap(box, e.box) || aabbOverlap(this.player.box, e.box)) {
        if (e.interact(this)) return true;
      }
    }
    return false;
  }

  // ---------------- update / draw ----------------

  update(game) {
    // fade transitions
    if (this.fadeDir !== 0) {
      this.fade += this.fadeDir * 3;
      if (this.fade >= 30 && this.pendingMap) {
        const { id, tx, ty } = this.pendingMap;
        this.pendingMap = null;
        this.loadMap(id, tx, ty);
        this.fadeDir = -1;
      } else if (this.fade <= 0) {
        this.fade = 0;
        this.fadeDir = 0;
      } else if (this.fade >= 30 && !this.pendingMap) {
        this.fade = 30;
        this.fadeDir = 0;
      }
      if (this.pendingMap || this.fade >= 30) return; // hold world during fade-out
    }

    if (this.banner > 0) this.banner--;
    if (this.cutsceneLock > 0) {
      this.cutsceneLock--;
      this.onCutscene?.(this);
      if (this.cutsceneLock === 0) this.onCutscene = null;
    }

    // playtime
    if (game.ticks % 60 === 0) this.state.playtime++;

    if (game.input.justPressed('pause')) {
      this.openPause();
      return;
    }
    if (game.input.justPressed('interact') && this.cutsceneLock <= 0) {
      this._tryInteract();
    }

    if (this.cutsceneLock <= 0) this.player.update(this);

    for (const e of this.entities) {
      if (!e.dead) e.update(this);
    }

    // contact damage
    for (const e of this.entities) {
      if (e.dead || !e.isEnemy || !e.hurtsPlayer || e.stunned > 0) continue;
      if (aabbOverlap(e.box, this.player.box)) {
        this.player.takeDamage(this, e.hurtsPlayer, e.cx, e.cy);
      }
    }

    // reap + spawn
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.dead) {
        if (e.isEnemy && !e.dropped) {
          e.dropped = true;
          this.particles.spawn('smoke', e.cx, e.cy, 8);
          sfx('enemyDie');
          if (!e.noDrop) rollDrop(this, e.cx, e.cy);
        }
        e.onDeath?.(this);
        this.entities.splice(i, 1);
      }
    }
    if (this._spawnQueue.length) {
      this.entities.push(...this._spawnQueue);
      this._spawnQueue.length = 0;
    }

    this.particles.update();

    // edge exits
    this._checkEdgeExits();

    // remember safe ground for pit respawns
    if (game.ticks % 30 === 0 && this.player.fallTime <= 0) {
      const f = this.map.flagsAt(
        Math.floor(this.player.cx / TILE), Math.floor(this.player.cy / TILE));
      if (!f.solid && !f.pit && !f.water && !f.lava && !f.damage) {
        this.player.rememberSafeSpot();
      }
    }

    // low health beep
    if (this.state.hearts > 0 && this.state.hearts <= 1 && game.ticks % 75 === 0) sfx('lowHp');

    this.camera.follow(this.player, this.map);
    this.mapDef.onTick?.(this);
  }

  _checkEdgeExits() {
    const p = this.player;
    const ex = this.map.exits;
    if (!ex || this.pendingMap) return;
    const margin = 1;
    if (p.x < -margin && ex.west) this._edgeWarp(ex.west, 'west');
    else if (p.x + p.w > this.map.pixelW + margin && ex.east) this._edgeWarp(ex.east, 'east');
    else if (p.y < -margin && ex.north) this._edgeWarp(ex.north, 'north');
    else if (p.y + p.h > this.map.pixelH + margin && ex.south) this._edgeWarp(ex.south, 'south');
    // clamp if no exit
    p.x = Math.max(-2, Math.min(p.x, this.map.pixelW - p.w + 2));
    p.y = Math.max(-2, Math.min(p.y, this.map.pixelH - p.h + 2));
  }

  _edgeWarp(exit, side) {
    const to = typeof exit === 'string' ? { map: exit } : exit;
    const target = getMapDef(to.map);
    const tw = target.grid[0].length;
    const th = target.grid.length;
    const p = this.player;
    const off = (to.shift || 0) * TILE;
    let tx, ty;
    if (side === 'west') { tx = tw - 1.2; ty = (p.y + off) / TILE; }
    if (side === 'east') { tx = 0.2; ty = (p.y + off) / TILE; }
    if (side === 'north') { tx = (p.x + off) / TILE; ty = th - 1.2; }
    if (side === 'south') { tx = (p.x + off) / TILE; ty = 0.2; }
    this.changeMap(to.map, Math.max(0, Math.min(tw - 1, tx)), Math.max(0, Math.min(th - 1, ty)));
  }

  draw(game, ctx) {
    const cam = this.camera;
    ctx.save();
    ctx.translate(0, HUD_H);
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H - HUD_H);
    ctx.clip();

    const theme = this.duskActive() ? 'dusk' : null;
    this.map.draw(ctx, cam, game.ticks, theme);

    // bush overlays (drawn over floor tiles)
    this._drawBushes(ctx, cam);

    // y-sorted entities + player
    const drawList = this.entities.filter(e => !e.dead && !e.invisible);
    drawList.push(this.player);
    drawList.sort((a, b) => (a.y + a.h + (a.zLayer || 0) * 1000) - (b.y + b.h + (b.zLayer || 0) * 1000));
    for (const e of drawList) e.draw(ctx, cam);

    this.particles.draw(ctx, cam);

    // darkness
    if (this.map.dark) this._drawDarkness(ctx, cam);

    // dusk tint outdoors
    if (this.duskActive()) {
      ctx.fillStyle = 'rgba(40,20,70,0.25)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
    }

    ctx.restore();

    drawHud(ctx, this);

    if (this.banner > 0) {
      const alpha = Math.min(1, this.banner / 20, (110 - this.banner) / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(8,8,20,0.8)';
      const w = this.bannerText.length * 6 + 20;
      ctx.fillRect((VIEW_W - w) / 2, 38, w, 16);
      drawTextCentered(ctx, this.bannerText, VIEW_W / 2, 42, '#f0d048');
      ctx.globalAlpha = 1;
    }

    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.fade / 30)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  _drawBushes(ctx, cam) {
    if (this.map.bushes.size === 0) return;
    const sprite = getSprite('bush');
    for (const idx of this.map.bushes) {
      const tx = idx % this.map.w;
      const ty = Math.floor(idx / this.map.w);
      const x = tx * TILE - Math.round(cam.x);
      const y = ty * TILE - Math.round(cam.y);
      if (x < -16 || y < -16 || x > VIEW_W || y > VIEW_H) continue;
      ctx.drawImage(sprite, x, y + 1);
    }
  }

  _drawDarkness(ctx, cam) {
    if (!this._darkCanvas) {
      this._darkCanvas = document.createElement('canvas');
      this._darkCanvas.width = VIEW_W;
      this._darkCanvas.height = VIEW_H - HUD_H;
    }
    const dc = this._darkCanvas.getContext('2d');
    dc.globalCompositeOperation = 'source-over';
    dc.fillStyle = 'rgba(0,0,10,0.88)';
    dc.clearRect(0, 0, VIEW_W, VIEW_H - HUD_H);
    dc.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
    dc.globalCompositeOperation = 'destination-out';
    const punch = (x, y, r) => {
      const g = dc.createRadialGradient(x, y, r * 0.3, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      dc.fillStyle = g;
      dc.beginPath();
      dc.arc(x, y, r, 0, Math.PI * 2);
      dc.fill();
    };
    punch(this.player.cx - cam.x, this.player.cy - cam.y, 42);
    for (const e of this.entities) {
      if (e.isTorch && e.lit) punch(e.cx - cam.x, e.cy - cam.y, 36);
    }
    ctx.drawImage(this._darkCanvas, 0, 0);
  }
}
