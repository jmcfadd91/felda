// Save data: a single live `state` object mutated during play, snapshotted to
// localStorage immediately and synced to the server when logged in.

export const SAVE_VERSION = 1;

export function newGameState() {
  return {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playtime: 0,
    heroName: 'Rin',
    checkpoint: { map: 'bramblewick_home', x: 5 * 16, y: 7 * 16 },
    player: null, // flattened below for the server; runtime uses top level
    heartsMax: 3,
    hearts: 3,
    gems: 0,
    arrows: 0,
    arrowsMax: 30,
    bombs: 0,
    bombsMax: 10,
    bottlePotion: false,
    items: [],            // 'sword','galewing','bombs','grapple','bow','whistle','bottle'
    equippedB: null,
    melodies: [],         // 'rousing','ember','tide','lament'
    heartPieces: 0,
    swordLevel: 0,
    flags: [],            // story flags (story/flags.js)
    dungeons: {},         // d1: {keys, map, compass, bossKey, opened:[], cleared}
    openedChests: [],     // world chest ids
    duskfall: false,
  };
}

export function hasFlag(state, flag) { return state.flags.includes(flag); }
export function setFlag(state, flag) {
  if (!state.flags.includes(flag)) state.flags.push(flag);
}

export function dungeonState(state, id) {
  if (!state.dungeons[id]) {
    state.dungeons[id] = { keys: 0, map: false, compass: false, bossKey: false, opened: [], cleared: false };
  }
  return state.dungeons[id];
}

// ---- serialization ----

export function serialize(state) {
  const s = { ...state, updatedAt: Date.now() };
  // server requires a `player` object; mirror the core stats into it
  s.player = {
    heartsMax: state.heartsMax, hearts: state.hearts, gems: state.gems,
    items: state.items, swordLevel: state.swordLevel,
  };
  return s;
}

export function deserialize(data) {
  if (!data || typeof data !== 'object' || data.version > SAVE_VERSION) return null;
  const st = { ...newGameState(), ...data };
  st.version = SAVE_VERSION;
  delete st.player; // runtime uses the flattened fields
  st.player = null;
  // Migrate saves created before the spawn-point fix: the old default
  // checkpoint (9,8) in bramblewick_home is a wall tile the player can't
  // move out of, so anyone still on the intro never made it past it.
  const cp = st.checkpoint;
  if (cp && cp.map === 'bramblewick_home' && cp.x === 9 * 16 && cp.y === 8 * 16) {
    st.checkpoint = { map: 'bramblewick_home', x: 5 * 16, y: 7 * 16 };
  }
  return st;
}

// ---- localStorage ----

const LS_PREFIX = 'felda_slot_';

export function saveLocal(slot, state) {
  try {
    localStorage.setItem(LS_PREFIX + slot, JSON.stringify(serialize(state)));
    return true;
  } catch {
    return false;
  }
}

export function loadLocal(slot) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + slot);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deleteLocal(slot) {
  try { localStorage.removeItem(LS_PREFIX + slot); } catch { /* ignore */ }
}

// ---- server sync ----

export const session = { username: null };

export async function api(path, opts = {}) {
  const res = await fetch(`/api/${path}`, {
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { ok: res.ok, status: res.status, data };
}

export async function checkLogin() {
  try {
    const r = await api('me');
    session.username = r.ok ? r.data.username : null;
  } catch {
    session.username = null;
  }
  return session.username;
}

let syncTimer = null;

// Save: localStorage immediately; server write is fire-and-forget w/ retry.
export function persist(slot, state) {
  const ok = saveLocal(slot, state);
  if (session.username) {
    const payload = serialize(state);
    const push = async (attempt) => {
      try {
        const r = await api(`saves/${slot}`, { method: 'PUT', body: payload });
        if (!r.ok && attempt < 3) retry(attempt);
      } catch {
        if (attempt < 3) retry(attempt);
      }
    };
    const retry = (attempt) => {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => push(attempt + 1), 5000 * (attempt + 1));
    };
    push(0);
  }
  return ok;
}

// Load: newest of server copy vs localStorage copy.
export async function loadSlot(slot) {
  const local = loadLocal(slot);
  let remote = null;
  if (session.username) {
    try {
      const r = await api(`saves/${slot}`);
      if (r.ok) remote = r.data.data;
    } catch { /* offline */ }
  }
  const pick = !remote ? local
    : !local ? remote
    : (remote.updatedAt || 0) >= (local.updatedAt || 0) ? remote : local;
  return pick ? deserialize(pick) : null;
}

export async function listSlots() {
  // Merge: prefer server metadata, fall back to local.
  const out = [null, null, null];
  for (let slot = 1; slot <= 3; slot++) {
    const local = loadLocal(slot);
    if (local) {
      out[slot - 1] = {
        slot,
        updatedAt: local.updatedAt || 0,
        summary: {
          hearts: local.heartsMax ?? 3,
          playtime: Math.floor(local.playtime || 0),
          name: local.heroName || 'Rin',
          region: local.checkpoint?.map || '',
        },
      };
    }
  }
  if (session.username) {
    try {
      const r = await api('saves');
      if (r.ok) {
        for (const s of r.data.slots) {
          const cur = out[s.slot - 1];
          if (!cur || s.updatedAt >= cur.updatedAt) {
            out[s.slot - 1] = { slot: s.slot, updatedAt: s.updatedAt, summary: s.summary || {} };
          }
        }
      }
    } catch { /* offline */ }
  }
  return out;
}

export async function deleteSlot(slot) {
  deleteLocal(slot);
  if (session.username) {
    try { await api(`saves/${slot}`, { method: 'DELETE', body: {} }); } catch { /* offline */ }
  }
}
