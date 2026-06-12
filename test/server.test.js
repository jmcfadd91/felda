import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/server.js';

let server;
let base;
let cookie = '';

function opts(method, body, withCookie = true) {
  const o = { method, headers: {} };
  if (withCookie && cookie) o.headers.Cookie = cookie;
  if (body !== undefined) {
    o.headers['Content-Type'] = 'application/json';
    o.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  return o;
}

function captureCookie(res) {
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
}

const SAVE = {
  version: 1,
  playtime: 120,
  heroName: 'Rin',
  checkpoint: { map: 'bramblewick', x: 5, y: 5 },
  player: { heartsMax: 3, hearts: 3, gems: 10, items: ['sword'] },
  flags: ['intro_done'],
};

before(async () => {
  server = createApp({ dbPath: ':memory:' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise(resolve => server.close(resolve)));

test('serves index.html with security headers', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.ok(res.headers.get('content-security-policy').includes("default-src 'self'"));
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
});

test('blocks path traversal', async () => {
  for (const path of ['/../package.json', '/..%2f..%2fserver/server.js', '/%2e%2e/server/db.js']) {
    const res = await fetch(`${base}${path}`);
    assert.notEqual(res.status, 200, `traversal not blocked: ${path}`);
  }
});

test('register validates input', async () => {
  let res = await fetch(`${base}/api/register`, opts('POST', { username: 'x', password: 'longenough1' }));
  assert.equal(res.status, 400);
  res = await fetch(`${base}/api/register`, opts('POST', { username: 'has space', password: 'longenough1' }));
  assert.equal(res.status, 400);
  res = await fetch(`${base}/api/register`, opts('POST', { username: 'gooduser', password: 'short' }));
  assert.equal(res.status, 400);
  res = await fetch(`${base}/api/register`, { method: 'POST', body: 'notjson' });
  assert.equal(res.status, 415);
});

test('register, duplicate, login flow', async () => {
  let res = await fetch(`${base}/api/register`, opts('POST', { username: 'hero_rin', password: 'correct-horse-1' }));
  assert.equal(res.status, 201);
  captureCookie(res);
  assert.ok(cookie.startsWith('felda_session='));

  res = await fetch(`${base}/api/register`, opts('POST', { username: 'HERO_RIN', password: 'correct-horse-1' }));
  assert.equal(res.status, 409, 'duplicate username (case-insensitive) should 409');

  res = await fetch(`${base}/api/login`, opts('POST', { username: 'hero_rin', password: 'wrong-password' }));
  assert.equal(res.status, 401);

  res = await fetch(`${base}/api/login`, opts('POST', { username: 'hero_rin', password: 'correct-horse-1' }));
  assert.equal(res.status, 200);
  captureCookie(res);
});

test('/api/me requires and honors session', async () => {
  let res = await fetch(`${base}/api/me`, opts('GET', undefined, false));
  assert.equal(res.status, 401);
  res = await fetch(`${base}/api/me`, opts('GET'));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).username, 'hero_rin');
});

test('save CRUD round-trip', async () => {
  let res = await fetch(`${base}/api/saves/1`, opts('PUT', SAVE));
  assert.equal(res.status, 200);

  res = await fetch(`${base}/api/saves`, opts('GET'));
  const { slots } = await res.json();
  assert.equal(slots.length, 1);
  assert.equal(slots[0].slot, 1);
  assert.equal(slots[0].summary.name, 'Rin');

  res = await fetch(`${base}/api/saves/1`, opts('GET'));
  const loaded = await res.json();
  assert.deepEqual(loaded.data, SAVE);

  res = await fetch(`${base}/api/saves/2`, opts('GET'));
  assert.equal(res.status, 404);

  res = await fetch(`${base}/api/saves/1`, opts('DELETE'));
  assert.equal(res.status, 200);
  res = await fetch(`${base}/api/saves/1`, opts('GET'));
  assert.equal(res.status, 404);
});

test('save validation: bad slot, bad shape, oversize', async () => {
  let res = await fetch(`${base}/api/saves/9`, opts('PUT', SAVE));
  assert.equal(res.status, 400);

  res = await fetch(`${base}/api/saves/1`, opts('PUT', { nonsense: true }));
  assert.equal(res.status, 400);

  const big = { ...SAVE, junk: 'x'.repeat(70 * 1024) };
  res = await fetch(`${base}/api/saves/1`, opts('PUT', big));
  assert.equal(res.status, 413);
});

test('cross-origin mutation rejected', async () => {
  const o = opts('PUT', SAVE);
  o.headers.Origin = 'https://evil.example';
  const res = await fetch(`${base}/api/saves/1`, o);
  assert.equal(res.status, 403);
});

test('login rate limit kicks in', async () => {
  let last;
  for (let i = 0; i < 12; i++) {
    last = await fetch(`${base}/api/login`, opts('POST', { username: 'nobody', password: 'wrongwrong' }, false));
  }
  assert.equal(last.status, 429);
  assert.ok(Number(last.headers.get('retry-after')) >= 1);
});

test('logout invalidates session', async () => {
  let res = await fetch(`${base}/api/logout`, opts('POST', {}));
  assert.equal(res.status, 200);
  res = await fetch(`${base}/api/me`, opts('GET'));
  assert.equal(res.status, 401);
});
