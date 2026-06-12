// Felda game server: static client + auth/save API. Zero npm dependencies;
// runs on any Node >= 22.5 (built-in SQLite), Raspberry Pi friendly.
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb } from './db.js';
import { serveStatic } from './static.js';
import { readJsonBody } from './router.js';
import { setSecurityHeaders, sameOrigin } from './security.js';
import { startRateLimitPurge } from './ratelimit.js';
import { getSession, purgeExpiredSessions } from './sessions.js';
import { handleRegister, handleLogin, handleLogout, handleMe, json } from './auth.js';
import {
  handleListSaves, handleLoadSave, handlePutSave, handleDeleteSave, MAX_SAVE_BYTES,
} from './saves.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(ROOT, '..', 'public');

export function createApp({ dbPath = join(ROOT, '..', 'data', 'felda.db') } = {}) {
  const db = openDb(dbPath);

  const server = createServer(async (req, res) => {
    setSecurityHeaders(res);
    let pathname;
    try {
      pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
    } catch {
      return json(res, 400, { error: 'Bad request.' });
    }

    if (!pathname.startsWith('/api/')) {
      return serveStatic(PUBLIC_DIR, req, res, pathname);
    }

    try {
      await handleApi(db, req, res, pathname);
    } catch (err) {
      console.error('API error:', err);
      if (!res.headersSent) json(res, 500, { error: 'Internal server error.' });
      else res.end();
    }
  });

  const purgeTimer = setInterval(() => purgeExpiredSessions(db), 60 * 60 * 1000);
  purgeTimer.unref();
  startRateLimitPurge();

  server.on('close', () => {
    clearInterval(purgeTimer);
    db.close();
  });
  return server;
}

async function handleApi(db, req, res, pathname) {
  const method = req.method;
  const mutating = method !== 'GET' && method !== 'HEAD';
  if (mutating && !sameOrigin(req)) {
    return json(res, 403, { error: 'Cross-origin request rejected.' });
  }

  // --- public endpoints ---
  if (method === 'POST' && (pathname === '/api/register' || pathname === '/api/login')) {
    const parsed = await readJsonBody(req, res, 4 * 1024);
    if (!parsed) return;
    return pathname === '/api/register'
      ? handleRegister(db, req, res, parsed.body)
      : handleLogin(db, req, res, parsed.body);
  }

  // --- authenticated endpoints ---
  const session = getSession(db, req);
  if (!session) return json(res, 401, { error: 'Not logged in.' });

  if (method === 'POST' && pathname === '/api/logout') return handleLogout(db, req, res, session);
  if (method === 'GET' && pathname === '/api/me') return handleMe(req, res, session);
  if (method === 'GET' && pathname === '/api/saves') return handleListSaves(db, req, res, session);

  const slotMatch = pathname.match(/^\/api\/saves\/(\d{1,2})$/);
  if (slotMatch) {
    const slot = slotMatch[1];
    if (method === 'GET') return handleLoadSave(db, req, res, session, slot);
    if (method === 'DELETE') return handleDeleteSave(db, req, res, session, slot);
    if (method === 'PUT') {
      const parsed = await readJsonBody(req, res, MAX_SAVE_BYTES);
      if (!parsed) return;
      return handlePutSave(db, req, res, session, slot, parsed.body, parsed.bytes);
    }
  }

  return json(res, 404, { error: 'Not found.' });
}

// Start directly unless imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8080;
  const host = process.env.HOST || '0.0.0.0';
  const server = createApp();
  server.listen(port, host, () => {
    console.log(`Felda server running at http://${host}:${port}`);
  });
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      console.log(`\n${sig} received, shutting down...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 3000).unref();
    });
  }
}
