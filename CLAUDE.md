# Felda: Whistle of Eras — build notes

Web-based 2D Zelda-like (original IP homage to Ocarina of Time) served from a
Raspberry Pi. Zero npm deps: `node:http` + `node:sqlite` server, vanilla-JS
ES-module canvas client, all art/audio generated in code.

**Plan file**: the approved full plan is at
`/root/.claude/plans/system-reminder-message-sent-at-fri-serialized-boot.md`
(may not exist in a fresh container — the summary below is self-sufficient).

## Status: IN PROGRESS — client boots are BLOCKED on missing world maps

`public/js/main.js` imports `./world/index.js` which **does not exist yet**.
Everything else listed below is written. Server is done and tested.

### Done
- `server/` complete + `test/server.test.js` — **10/10 tests pass** (`npm test`,
  script is `node --test`; `node --test test/` glob form fails on Node 22.22).
  Auth (scrypt, hashed session tokens, SameSite=Strict), saves (3 slots,
  64KB limit), rate limiting, CSP/security headers, traversal-safe static.
- Engine: `game.js` (fixed timestep + scene stack), `input.js` (kbd+touch,
  `Input.textCapture` static suspends mapping during text fields),
  `renderer.js` (320x240 integer scale), `camera.js` (HUD_H=24),
  `tilemap.js` (string grids, legend, mutable bushes set, row-width
  validation), `physics.js` (per-axis AABB + corner nudge), `entity.js`,
  `save.js` (localStorage + server sync newest-wins, `persist/loadSlot/
  listSlots/deleteSlot/checkLogin/session`).
- gfx: `palette.js`, `sprites.js` (baker w/ flip+swap), `tiles.js`
  (procedural tilesets, THEMES, TILE_TYPES + flags), `effects.js` (particles),
  `spritedata.js` (hero/sword/pickups/objects ONLY — see TODO).
- audio: full synth/scheduler/songs/sfx (12 songs, ~30 sfx). AudioContext
  unlocks on title keypress.
- entities: `player.js` (move/sword/spin/items/pits), `items.js` (Galewing,
  Bomb, Arrow, Grapple), `pickups.js` (drop table), `enemies.js` (all 8),
  `bosses.js` (all 4 + HeartContainer + RelicPickup), `npcs.js`,
  `index.js` factory (registerType).
- world: `puzzles.js` (Chest/Sign/SaveStatue/Pot/Door/FloorSwitch/
  CrystalSwitch/EyeSwitch/Torch/PushBlock/Warp/Gate/HeartPiece).
- ui: `textrender.js` (5x7 font), `hud.js`, `dialog.js` (typewriter, 2-choice),
  `menus.js` (PauseScene w/ equip + save&quit, ShopScene).
- story: `flags.js` (goal text), `dialogue.js` (all NPC lines; Ash teaches
  melodies; shop hook), `melodies.js` (WhistleScene + 4 melodies:
  rousing ULRU, ember DRRD, tide LUDL, lament UDUD).
- scenes: `title.js`, `fileselect.js` (login/register + slots),
  `play.js` (the core orchestrator — combat resolution, channels, dungeon
  keys, giveContents/acquireItem, checkpoints, darkness, duskfall, banners),
  `gameover.js`, `ending.js` (credits).
- `index.html`, `style.css` (touch UI), `main.js` (`?dev=1` → devroom sandbox,
  `window.felda`).

### TODO (in order)
1. **`public/js/world/index.js`** — imports all map modules (main.js needs it).
2. **Map files** (use `defineMap` from engine/tilemap.js):
   - `maps_overworld.js`: bramblewick (village), bramblewick_home (start,
     `state.checkpoint` default = `bramblewick_home` 9,8), shrine_glade
     (spirit NPC), verdant_approach (D1 door: melody hook `rousing` sets
     `d1_open`), heartfield (hub, Ash spawns ifFlag d1_clear), scorch_trail
     (melody `ember`→`d2_open`, D2 door), marsh, lake (melody `tide`→
     `d3_open`), nocturne_approach (melody `lament`→`castle_open`).
   - `maps_town.js`: town (id `town`; Lament warps to town 14,16; shopkeep/
     innkeep/NPCs; Ash post-d2 + post-d3), shop + inn interiors.
   - `maps_dungeon1.js` (theme dungeon_green, dungeon:'d1', 8 rooms, item
     galewing, boss bramblemaw w/ clearFlag d1_clear, relic 'verdant',
     exitTo verdant_approach), `maps_dungeon2.js` (fire, bombs, magmarch,
     cinder), `maps_dungeon3.js` (water_dungeon, grapple, abyssalchoir, tide),
     `maps_castle.js` (castle theme, sword2 chest, vhorrun → ending portal
     that pushes EndingScene), `devroom` (sandbox, all objects/enemies).
   - Dungeon pattern: each room = own map (room-locked camera free); doors =
     Door entity on wall-gap tile + Warp on same tile; shared door id opens
     both sides; keys via `play.gainKey/useKey`; map/compass/bosskey chests.
   - Needed helper: a `TileSwapper` entity (channel → setTile list) for D3
     water-level puzzles — add to puzzles.js + register in entities/index.js.
3. **Sprite art still missing** (add to `spritedata.js`; baker errors on
   unknown names): enemies `thornling_0/1, pricklepod_0/1, gloomwisp_0/1,
   emberkin_0/1, cindershell_0/1, tidemaw_0/1, voltjelly_0/1,
   wraithguard_0/1, wraithguard_atk_0/1, thornvine_0/1`; bosses
   `bramblemaw_closed_0/1, bramblemaw_open_0/1, magmarch_0/1,
   magmarch_flipped, serpent_0/1, serpent_pinned, vhorrun_0/1, vhorrun_stun`;
   NPCs `npc_man/npc_woman/npc_elder/npc_kid/npc_ash/npc_liora/npc_guard/
   npc_spirit` each `_down_0,_down_1,_up_0,_up_1,_side_0,_side_1` (share rows
   via palette-recolored defs; aliases may point at the same def object).
   Also hud icons referenced: `galewing_icon, grapple_icon, bow_icon,
   bottle_icon, whistle_icon` (hud.js try/catches, menus.js drawItemIcon
   draws procedurally — either add sprites or reuse drawItemIcon in hud).
4. **Galewing flame relay**: in items.js Galewing.update, set `this.flaming`
   when overlapping a lit Torch entity, call `torch.light(play)` on unlit
   ones (D1 dark-room puzzle depends on it).
5. Wire intro: bramblewick_home def `onEnter` → if !intro_done, say intro
   text + setFlag intro_done. Controls sign in the room.
6. 4 overworld heart pieces (`heartpiece` entities w/ ids), bombable cave
   (`bombReveal` map field exists in play.js).
7. README.md (controls, dev run `npm start` → :8080, Pi deploy: Node 22.5+,
   systemd unit, FELDA_SECURE_COOKIES=1 behind TLS, FELDA_TRUST_PROXY=1).
8. Verify: `npm test`; browser: title→register→slot→intro→D1 full clear;
   `?dev=1` sandbox for items/enemies. `node --check` each js file catches
   syntax errors (ES modules OK with --check... actually use
   `node --input-type=module --check < file` or just load in browser).
9. Push + draft PR (branch `claude/zelda-web-game-u60byj`).

### Conventions
- Tiles: legend in tilemap.js DEFAULT_LEGEND ('.' floor, '#' wall, T tree,
  w water, l lava, h pit, b bush, B crackwall, S stump(hookable), x post
  (hookable), c cave, '=' bridge, '-' void, g tallgrass, ',' flowers,
  p path, s sand, f fence, '>' stairs, k carpet, P plank).
- Map def: `{id, name, theme, music, outdoor?, dark?, dungeon?, grid[],
  legend?, entities[], exits{north/south/east/west: id|{map,shift}},
  melodies?{id:fn(play)}, bombReveal?{'tx,ty':char}, onEnter?, onTick?}`.
- Entity defs: `{type, x, y(tiles), id?, contents?, ifFlag?, unlessFlag?,
  when?(state)}` — chest contents: 'gems:N','key','bosskey','map','compass',
  'heartpiece','bombs:N','arrows:N','potion','item:NAME'.
- Boss map entity example: `{type:'bramblemaw', x:10, y:4,
  clearFlag:'d1_clear', relic:'verdant', exitTo:{map:'verdant_approach',
  x:10, y:5}, unlessFlag:'d1_clear'}`.
- Story flow/flags: see story/flags.js header comment.
