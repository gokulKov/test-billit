const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3020;
const root = __dirname;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.jsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500);
        return res.end('Server error');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`JSX demo server running on http://localhost:${PORT}`);
});
