// In-memory sliding-window rate limiter. Per-process state is fine on a
// single-instance Pi server; restart resets are acceptable.

const buckets = new Map(); // key -> [timestamps]

export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  let arr = buckets.get(key);
  if (!arr) {
    arr = [];
    buckets.set(key, arr);
  }
  // Drop timestamps outside the window.
  while (arr.length && arr[0] <= now - windowMs) arr.shift();
  if (arr.length >= max) {
    const retryAfter = Math.ceil((arr[0] + windowMs - now) / 1000);
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  }
  arr.push(now);
  return { ok: true };
}

export function startRateLimitPurge(intervalMs = 10 * 60 * 1000) {
  const timer = setInterval(() => {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [key, arr] of buckets) {
      while (arr.length && arr[0] <= cutoff) arr.shift();
      if (arr.length === 0) buckets.delete(key);
    }
  }, intervalMs);
  timer.unref();
  return timer;
}

export function clientIp(req) {
  // Direct connection address. If you put Felda behind a reverse proxy, set
  // FELDA_TRUST_PROXY=1 so the proxy's X-Forwarded-For is honored instead.
  if (process.env.FELDA_TRUST_PROXY === '1') {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}
