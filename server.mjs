import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 8080);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webm': 'video/webm', '.svg': 'image/svg+xml', '.md': 'text/plain' };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (req.method === 'POST') {
      if (req.headers.origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(req.headers.origin)) { res.writeHead(403).end(); return; }
      const chunks = []; let bytes = 0;
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 100 * 1024 * 1024) throw new Error('Payload too large'); chunks.push(chunk); }
      const body = Buffer.concat(chunks);
      if (url.pathname === '/__log') { console.log('[renderer]', body.toString().slice(0, 12000)); res.end('ok'); return; }
      if (url.pathname === '/__shot' || url.pathname === '/__evidence') {
        const name = url.searchParams.get('name') || 'capture.png';
        if (!/^[a-zA-Z0-9_-]+\.(png|webm|json)$/.test(name)) { res.writeHead(400).end('Invalid name'); return; }
        const stage = url.searchParams.get('stage') || 'stage-01';
        if (!/^(stage-0[1-4]|v03-[a-z0-9-]{1,40}|v04-p0[a-z0-9-]{0,34})$/.test(stage)) { res.writeHead(400).end(); return; }
        const dir = path.join(root, 'evidence', stage);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, name), body);
        console.log('Evidence saved:', stage, name);
        res.end('ok'); return;
      }
      res.writeHead(404).end(); return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filename = path.resolve(root, '.' + pathname);
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await fs.readFile(filename);
    res.writeHead(200, { 'content-type': (mime[path.extname(filename)] || 'application/octet-stream') + '; charset=utf-8', 'cache-control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(data);
  } catch (e) { res.writeHead(e.code === 'ENOENT' ? 404 : 400).end(e.code === 'ENOENT' ? 'Not found' : 'Invalid request'); }
});
server.listen(port, '127.0.0.1', () => console.log(`PELAGIC: http://127.0.0.1:${port}/`));
process.on('SIGINT', () => server.close());
