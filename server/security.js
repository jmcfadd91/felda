// Security headers, origin checks, and input validators.

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function setSecurityHeaders(res) {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self'; " +
    "script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
}

// Reject cross-origin state-changing requests. Browsers send Origin on
// fetch POST/PUT/DELETE; requests with no Origin (curl, same-origin GET)
// pass through — cookies + SameSite=Strict carry the rest of the defense.
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export function validUsername(u) {
  return typeof u === 'string' && USERNAME_RE.test(u);
}

export function validPassword(p) {
  return typeof p === 'string' && p.length >= 8 && p.length <= 100;
}

export function validSlot(s) {
  const n = Number(s);
  return Number.isInteger(n) && n >= 1 && n <= 3 ? n : null;
}

// Structural check of a save payload before storing. The server treats save
// data as opaque, but rejects garbage shapes so the slot list stays sane.
export function validSaveData(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj) &&
    Number.isInteger(obj.version) && obj.version >= 1 &&
    typeof obj.player === 'object' && obj.player !== null;
}

// Small summary derived server-side from the payload for the slot list,
// so clients never need to download full saves to render File Select.
export function saveSummary(obj) {
  const p = obj.player || {};
  return JSON.stringify({
    hearts: typeof p.heartsMax === 'number' ? p.heartsMax : 3,
    region: typeof obj.checkpoint?.map === 'string' ? obj.checkpoint.map.slice(0, 40) : '',
    playtime: typeof obj.playtime === 'number' ? Math.floor(obj.playtime) : 0,
    name: typeof obj.heroName === 'string' ? obj.heroName.slice(0, 12) : 'Rin',
  });
}
