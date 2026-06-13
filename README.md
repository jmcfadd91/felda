# Felda: Whistle of Eras

A complete, original 2D action-adventure for the browser — a loving homage to
the golden age of 16-bit adventures, designed to be served from a Raspberry
Pi. Three relics, four dungeons, a princess in disguise, and a kingdom that
needs the right four notes.

Everything is generated in code: pixel art, tilesets, music, and sound are
all synthesized at runtime. **Zero npm dependencies** — the server uses only
Node's built-in modules (`node:http`, `node:sqlite`, `node:crypto`).

## Play

```bash
npm start        # serves on http://0.0.0.0:8080
```

Requires **Node.js >= 22.5** (built-in SQLite). Open `http://<host>:8080`.

Create an account (saves sync to the server, playable from any device on
your network) or pick **Play (Local Saves)** for browser-local saves. Three
save slots either way; progress also autosaves at story beats, dungeon
entrances, and wayshrines.

### Controls

| Action | Keys |
|---|---|
| Move | Arrow keys / WASD |
| Sword (hold to charge a spin attack) | J / Z / Space |
| Item (equipped to B in the pause menu) | K / X |
| Talk / read / open | E / Enter |
| Pause, inventory, save & quit | Esc / P |

Touch controls appear automatically on touch devices.

### The Whistle

Equip the Whistle of Eras to B, press B, then play four notes with the
arrow keys. Songs are taught by the people you meet — and written down in
the pause menu if you forget.

## Development

```bash
npm test                  # server integration tests + world map validation
npm start                 # then open http://localhost:8080
```

- `http://localhost:8080/?dev=1` boots straight into a sandbox room with all
  items, melodies, and one of every enemy/puzzle object. `window.felda` is
  the live game object in the console. Add `&map=<id>` to start elsewhere.
- The world is authored as string grids in `public/js/world/`; run
  `npm test` after editing — it validates grid shape, tile legend, exits,
  warp targets, and entity types.

### Layout

```
server/            zero-dependency HTTP server: auth, save slots, static
public/js/engine/  game loop, input, renderer, tilemap, physics, save sync
public/js/gfx/     palettes, sprite baker, procedural tilesets, particles
public/js/audio/   chiptune synth, song scheduler, sound effects
public/js/entities/ player, enemies, bosses, items, NPCs
public/js/world/   maps (overworld, town, 3 dungeons, castle), puzzle objects
public/js/ui/      pixel font, HUD, dialog, menus, shop
public/js/scenes/  title, file select, play, game over, ending
public/js/story/   dialogue, quest flags, whistle melodies
test/              node:test suites (server API + map validation)
```

## Raspberry Pi deployment

Works on any Pi that runs Node 22 (Pi 3 or later recommended; the server is
a few MB of RSS — all rendering happens in the player's browser).

1. **Install Node 22** (NodeSource, arm64/armhf):

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install the game:**

   ```bash
   sudo useradd -r -m -d /opt/felda -s /usr/sbin/nologin felda
   sudo -u felda git clone https://github.com/jmcfadd91/felda.git /opt/felda/app
   ```

   No `npm install` needed. The SQLite database is created at
   `data/felda.db` on first run.

3. **systemd unit** — `/etc/systemd/system/felda.service`:

   ```ini
   [Unit]
   Description=Felda game server
   After=network.target

   [Service]
   User=felda
   WorkingDirectory=/opt/felda/app
   ExecStart=/usr/bin/node server/server.js
   Environment=PORT=8080
   Restart=on-failure
   NoNewPrivileges=true
   ProtectSystem=strict
   ReadWritePaths=/opt/felda/app/data

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable --now felda
   ```

4. **Optional HTTPS / reverse proxy.** For LAN play, plain HTTP is fine.
   If you expose Felda to the internet, put it behind Caddy or nginx with
   TLS (Let's Encrypt) and set these environment variables in the unit:

   ```ini
   Environment=FELDA_SECURE_COOKIES=1   # session cookies get the Secure flag
   Environment=FELDA_TRUST_PROXY=1      # rate limiting honors X-Forwarded-For
   Environment=HOST=127.0.0.1           # only the proxy can reach Node
   ```

### Security notes

- Passwords are hashed with scrypt (N=16384, r=8, p=1, per-user salt).
- Session tokens are 256-bit random values; only their SHA-256 is stored.
- Cookies are `HttpOnly; SameSite=Strict` (+ `Secure` behind TLS).
- All SQL uses prepared statements; auth endpoints are rate-limited per IP;
  cross-origin mutations are rejected; save payloads are size- and
  shape-validated (64 KB cap); static serving is path-traversal-safe; CSP
  forbids inline script.

## License

MIT. All art, music, story, and names are original.
