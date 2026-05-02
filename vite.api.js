import chatHandler from './api/chat.js';
import authLogin from './api/auth/login.js';
import authRegister from './api/auth/register.js';
import authMe from './api/auth/me.js';
import healthHandler from './api/health.js';

function getPathname(url) {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

const routes = new Map([
  ['/api/chat', chatHandler],
  ['/api/auth/login', authLogin],
  ['/api/auth/register', authRegister],
  ['/api/auth/me', authMe],
  ['/api/health', healthHandler],
]);

function apiMiddleware(req, res, next) {
  const pathname = getPathname(req.url || '');
  const handler = routes.get(pathname);

  if (handler) {
    handler(req, res);
    return;
  }

  next();
}

export function nexbotApiPlugin() {
  return {
    name: 'nexbot-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware);
    },
  };
}

