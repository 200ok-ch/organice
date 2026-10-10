/* global process */

// Serves the production bundle in dist/ for the e2e tests on CI.
//
// Routes like /sample have no file of their own, so unknown paths get
// index.html (the client-side router takes over), as on a real deployment.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname));
  for (const file of [join(root, path), join(root, 'index.html')]) {
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
      });
      response.end(body);
      return;
    } catch {
      // Not a file: try the next candidate.
    }
  }
  response.writeHead(404).end();
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
