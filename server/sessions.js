// Session tokens: 32 random bytes, base64url in the cookie; only the SHA-256
// of the token is stored so a database leak can't hijack live sessions.
import { randomBytes, createHash } from 'node:crypto';

const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const COOKIE_NAME = 'felda_session';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), userId, now, now + SESSION_MS);
  return token;
}

export function getSession(db, req) {
  const token = parseCookie(req.headers.cookie)[COOKIE_NAME];
  if (!token || token.length > 64) return null;
  const row = db.prepare(
    'SELECT s.token_hash, s.user_id, s.expires_at, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'
  ).get(hashToken(token));
  if (!row) return null;
  const now = Date.now();
  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    return null;
  }
  // Sliding expiry: refresh when past the halfway point.
  if (row.expires_at - now < SESSION_MS / 2) {
    db.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?')
      .run(now + SESSION_MS, row.token_hash);
  }
  return { userId: row.user_id, username: row.username, tokenHash: row.token_hash };
}

export function destroySession(db, session) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.tokenHash);
}

export function sessionCookie(token) {
  const secure = process.env.FELDA_SECURE_COOKIES === '1' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}${secure}`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export function purgeExpiredSessions(db) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}

function parseCookie(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}
