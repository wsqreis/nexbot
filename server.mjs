import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';
import authLogin from './api/auth/login.js';
import authRegister from './api/auth/register.js';
import authMe from './api/auth/me.js';
import dashboardConfigHandler from './api/dashboard/config.js';
import dashboardRegionsHandler from './api/dashboard/regions.js';
import dashboardGtmHandler from './api/dashboard/gtm.js';
import dashboardDeploymentsHandler from './api/dashboard/deployments.js';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const indexFile = path.join(distDir, 'index.html');
const port = Number(process.env.PORT || '3000');

const routes = new Map([
  ['/api/chat', chatHandler],
  ['/api/auth/login', authLogin],
  ['/api/auth/register', authRegister],
  ['/api/auth/me', authMe],
  ['/api/dashboard/config', dashboardConfigHandler],
  ['/api/dashboard/regions', dashboardRegionsHandler],
  ['/api/dashboard/gtm', dashboardGtmHandler],
  ['/api/dashboard/deployments', dashboardDeploymentsHandler],
  ['/api/health', healthHandler],
]);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function getPathname(url) {
  try {
    return new URL(url, `http://127.0.0.1:${port}`).pathname;
  } catch {
    return url;
  }
}

function getContentType(filePath) {
  return contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

async function serveFile(res, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      return false;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', getContentType(filePath));
    res.setHeader('Content-Length', stat.size);
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
}

function resolvePublicPath(pathname) {
  if (pathname.startsWith('/widget/')) {
    return path.join(publicDir, pathname.slice(1));
  }

  if (pathname === '/favicon.ico') {
    return path.join(publicDir, 'favicon.ico');
  }

  return null;
}

function resolveDistPath(pathname) {
  const cleanPath = pathname.replace(/^\/+/, '') || 'index.html';
  return path.join(distDir, cleanPath);
}

const server = http.createServer(async (req, res) => {
  const pathname = getPathname(req.url || '/');
  const handler = routes.get(pathname);

  if (handler) {
    await handler(req, res);
    return;
  }

  const publicPath = resolvePublicPath(pathname);
  if (publicPath && await serveFile(res, publicPath)) {
    return;
  }

  const distPath = resolveDistPath(pathname);
  if (await serveFile(res, distPath)) {
    return;
  }

  if (await serveFile(res, indexFile)) {
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`NexBot server listening on http://localhost:${port}`);
});
