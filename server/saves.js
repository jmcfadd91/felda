// Save slot CRUD. Save payloads are opaque JSON from the client, validated
// for shape and size only — nothing server-side ever trusts their contents.
import { json } from './auth.js';
import { validSlot, validSaveData, saveSummary } from './security.js';
import { rateLimit, clientIp } from './ratelimit.js';

export const MAX_SAVE_BYTES = 64 * 1024;

export function handleListSaves(db, req, res, session) {
  if (!limited(req, res, 'saves', 60)) return;
  const rows = db.prepare('SELECT slot, summary, updated_at FROM saves WHERE user_id = ? ORDER BY slot')
    .all(session.userId);
  return json(res, 200, {
    slots: rows.map(r => ({
      slot: r.slot,
      updatedAt: r.updated_at,
      summary: safeParse(r.summary),
    })),
  });
}

export function handleLoadSave(db, req, res, session, slotParam) {
  if (!limited(req, res, 'saves', 60)) return;
  const slot = validSlot(slotParam);
  if (!slot) return json(res, 400, { error: 'Slot must be 1-3.' });
  const row = db.prepare('SELECT data, updated_at FROM saves WHERE user_id = ? AND slot = ?')
    .get(session.userId, slot);
  if (!row) return json(res, 404, { error: 'No save in that slot.' });
  return json(res, 200, { slot, updatedAt: row.updated_at, data: safeParse(row.data) });
}

export function handlePutSave(db, req, res, session, slotParam, body, rawByteLength) {
  if (!limited(req, res, 'savewrite', 30)) return;
  const slot = validSlot(slotParam);
  if (!slot) return json(res, 400, { error: 'Slot must be 1-3.' });
  if (rawByteLength > MAX_SAVE_BYTES) return json(res, 413, { error: 'Save data too large.' });
  if (!validSaveData(body)) return json(res, 400, { error: 'Malformed save data.' });

  const now = Date.now();
  db.prepare(`
    INSERT INTO saves (user_id, slot, data, summary, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, slot) DO UPDATE SET data = excluded.data,
      summary = excluded.summary, updated_at = excluded.updated_at
  `).run(session.userId, slot, JSON.stringify(body), saveSummary(body), now);
  return json(res, 200, { slot, updatedAt: now });
}

export function handleDeleteSave(db, req, res, session, slotParam) {
  if (!limited(req, res, 'savewrite', 30)) return;
  const slot = validSlot(slotParam);
  if (!slot) return json(res, 400, { error: 'Slot must be 1-3.' });
  db.prepare('DELETE FROM saves WHERE user_id = ? AND slot = ?').run(session.userId, slot);
  return json(res, 200, { ok: true });
}

function limited(req, res, bucket, perMinute) {
  const rl = rateLimit(`${bucket}:${clientIp(req)}`, perMinute, 60 * 1000);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    json(res, 429, { error: 'Too many requests.' });
    return false;
  }
  return true;
}

function safeParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}
