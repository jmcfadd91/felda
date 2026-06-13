# Felda: Whistle of Eras — build notes

Web-based 2D Zelda-like (original IP homage to Ocarina of Time) served from a
Raspberry Pi. Zero npm deps: `node:http` + `node:sqlite` server, vanilla-JS
ES-module canvas client, all art/audio generated in code. See README.md for
controls, dev workflow, and Pi deployment.

## Status: COMPLETE and verified

- `npm test` — 15/15 (10 server integration + 5 world-map validation).
  Test script is `node --test`; the `node --test test/` directory form fails
  on Node 22.22, use the bare form.
- Browser-verified with Playwright (chromium preinstalled at
  `/opt/pw-browsers`, set `NODE_PATH=/opt/node22/lib/node_modules` and
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`): title → file select → new
  game → intro → village walk → pause menu → devroom combat, plus 14 deep
  functional checks (melody hooks open dungeons, key/door flow, boss defeat
  → heart vessel + relic + autosave, relic exit warp, whistle note UI,
  duskfall, shop purchases, checkpoint persistence, game-over → continue,
  client↔server account + save sync, Vhorrun → end portal → credits).

## Architecture quick map

- `server/` — zero-dep HTTP: scrypt auth, SHA-256-hashed session tokens,
  SameSite=Strict cookies, 3 save slots (64KB cap), rate limiting, CSP,
  traversal-safe static. Entry `server/server.js`, exports `createApp` for
  tests.
- `public/js/engine/` — fixed-timestep `Game` w/ scene stack; `Input`
  (kbd+touch, `Input.textCapture` suspends mapping for text fields);
  320x240 integer-scaled renderer; `Tilemap` (string grids, legend in
  `DEFAULT_LEGEND`, mutable bush set, width validation); per-axis AABB
  physics + corner nudge; `save.js` (localStorage + server newest-wins).
- `public/js/gfx/` — `spritedata.js` pixel-string art (villager template
  builder for NPCs; missing `_1` frames auto-alias to `_0`); `sprites.js`
  baker (flip/palette-swap cache); `tiles.js` procedural tilesets per THEME;
  `effects.js` particles.
- `public/js/audio/` — pulse/tri/noise synth, lookahead scheduler, 13 songs
  (`songs.js` text tracks), ~30 SFX. Unlocked on first input at title.
- `public/js/entities/` — player (sword/spin/items/pit-fall), 8 enemies,
  4 bosses (+ HeartContainer/RelicPickup), NPCs (dialogue ids), items
  (Galewing w/ torch flame relay, Bomb, Arrow, Grapple), pickups/drops,
  `index.js` factory + `registerType`/`knownTypes`.
- `public/js/world/` — `puzzles.js` toolbox (Chest/Door/Switches/Torch/
  PushBlock/Warp/Gate/HeartPiece/TileSwapper); `dungeonkit.js` room factory
  (20x13 rooms, door gaps + Door entity + Warp on same tile, shared ids
  persist both sides); maps: overworld (30x20, edge openings rows 9-11 /
  cols 14-16), town, d1 (8 rooms), d2 (9), d3 (9), castle (7 + EndPortal),
  devroom.
- `public/js/story/` — dialogue (flag-conditional, first match wins),
  flags.js (goal text), melodies.js (WhistleScene; arrow-key note entry).
- Scenes: title, fileselect (login/register + slots, offline fallback),
  play (the orchestrator), gameover, ending (credits).

## Conventions

- Map def: `{id, name, theme, music, duskMusic?, outdoor?, dark?, dungeon?,
  grid[], legend?, entities[], exits{n/s/e/w}, melodies?{id:fn(play)},
  bombReveal?{'tx,ty':char}, onEnter?(play) (fires after fade-in), onTick?}`.
- Entity def: `{type, x, y (tiles), id?, contents?, ifFlag?, unlessFlag?,
  when?(state)}`. Chest contents grammar: 'gems:N', 'key', 'bosskey', 'map',
  'compass', 'heartpiece', 'bombs:N', 'arrows:N', 'potion', 'item:NAME'.
- Tile legend: '.' floor, ',' flowers, g tallgrass, p path, s sand, '#' wall,
  r cliff, T tree, w water, l lava, h pit, '-' void, '=' bridge, f fence,
  b bush(cuttable), S stump / x post (hookable), B crackwall, c cave
  (walkable doorway — pair with a warp), '>' stairs, k carpet, P plank.
- Story flags: see `story/flags.js` header. Melodies: rousing ULRU,
  ember DRRD, tide LUDL, lament UDUD.
- `?dev=1` boots the devroom with everything unlocked (`&map=<id>` to start
  elsewhere); `window.felda` is the Game (scenes[0] is PlayScene in dev).

## If you change world content

Run `npm test` — `test/maps.test.js` validates grid rectangularity, legend
chars, exit/warp targets, entity types, and chest-id uniqueness.
