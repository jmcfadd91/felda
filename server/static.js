// Traversal-safe static file server rooted at public/.
import { createReadStream, statSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

export function serveStatic(root, req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return notFound(res);
  }
  if (decoded.includes('\0')) return notFound(res);
  if (decoded.endsWith('/')) decoded += 'index.html';

  const rootAbs = resolve(root);
  const fileAbs = resolve(join(rootAbs, decoded));
  // Reject anything that escapes the public root (.. traversal etc.).
  if (fileAbs !== rootAbs && !fileAbs.startsWith(rootAbs + sep)) return notFound(res);

  const ext = extname(fileAbs).toLowerCase();
  const mime = MIME[ext];
  if (!mime) return notFound(res);

  let stat;
  try {
    stat = statSync(fileAbs);
  } catch {
    return notFound(res);
  }
  if (!stat.isFile()) return notFound(res);

  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(fileAbs).pipe(res);
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}
