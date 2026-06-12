// JSON body reader with a hard byte limit enforced while streaming —
// oversized requests are rejected before they finish uploading.

export function readJsonBody(req, res, maxBytes) {
  return new Promise((resolve) => {
    const type = req.headers['content-type'] || '';
    if (!type.startsWith('application/json')) {
      fail(res, 415, 'Content-Type must be application/json.');
      return resolve(null);
    }
    const chunks = [];
    let total = 0;
    let aborted = false;
    req.on('data', (chunk) => {
      if (aborted) return;
      total += chunk.length;
      if (total > maxBytes) {
        aborted = true;
        fail(res, 413, 'Request body too large.');
        req.destroy();
        return resolve(null);
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ body: text.length ? JSON.parse(text) : {}, bytes: total });
      } catch {
        fail(res, 400, 'Invalid JSON.');
        resolve(null);
      }
    });
    req.on('error', () => {
      if (!aborted) resolve(null);
    });
  });
}

function fail(res, status, message) {
  if (res.headersSent || res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: message }));
}
