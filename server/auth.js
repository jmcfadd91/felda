// Registration, login, logout. Passwords hashed with built-in scrypt
// (memory-hard, no native deps — bcrypt would need ARM compilation on a Pi).
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createSession, destroySession, sessionCookie, clearCookie } from './sessions.js';
import { validUsername, validPassword } from './security.js';
import { rateLimit, clientIp } from './ratelimit.js';

const SCRYPT = { N: 16384, r: 8, p: 1, keyLen: 32 };

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keyLen, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length,
    { N: Number(N), r: Number(r), p: Number(p) });
  return timingSafeEqual(actual, expected);
}

// Hash for nonexistent users so response timing doesn't reveal which
// usernames exist.
const DUMMY_HASH = hashPassword('dummy-password-for-timing');

export function handleRegister(db, req, res, body) {
  const rl = rateLimit(`register:${clientIp(req)}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return tooMany(res, rl.retryAfter);

  const { username, password } = body || {};
  if (!validUsername(username)) {
    return json(res, 400, { error: 'Username must be 3-20 characters: letters, numbers, underscore.' });
  }
  if (!validPassword(password)) {
    return json(res, 400, { error: 'Password must be 8-100 characters.' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return json(res, 409, { error: 'That username is taken.' });

  const info = db.prepare('INSERT INTO users (username, pass_hash, created_at) VALUES (?, ?, ?)')
    .run(username, hashPassword(password), Date.now());
  const token = createSession(db, Number(info.lastInsertRowid));
  res.setHeader('Set-Cookie', sessionCookie(token));
  return json(res, 201, { username });
}

export function handleLogin(db, req, res, body) {
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return tooMany(res, rl.retryAfter);

  const { username, password } = body || {};
  if (typeof username !== 'string' || typeof password !== 'string' ||
      username.length > 20 || password.length > 100) {
    return json(res, 400, { error: 'Invalid credentials.' });
  }
  const user = db.prepare('SELECT id, username, pass_hash FROM users WHERE username = ?').get(username);
  const ok = user ? verifyPassword(password, user.pass_hash) : (verifyPassword(password, DUMMY_HASH), false);
  if (!ok) return json(res, 401, { error: 'Invalid credentials.' });

  const token = createSession(db, user.id);
  res.setHeader('Set-Cookie', sessionCookie(token));
  return json(res, 200, { username: user.username });
}

export function handleLogout(db, req, res, session) {
  destroySession(db, session);
  res.setHeader('Set-Cookie', clearCookie());
  return json(res, 200, { ok: true });
}

export function handleMe(req, res, session) {
  return json(res, 200, { username: session.username });
}

export function json(res, status, obj) {
  const data = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(data);
}

function tooMany(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter));
  return json(res, 429, { error: 'Too many attempts. Please wait and try again.' });
}
