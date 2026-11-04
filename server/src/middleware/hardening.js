import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

export function attachRequestId(request, response, next) {
  request.id = randomUUID();
  response.setHeader('X-Request-Id', request.id);
  next();
}

export function securityHeaders(_request, response, next) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-DNS-Prefetch-Control', 'off');
  response.setHeader('X-Download-Options', 'noopen');
  response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  response.setHeader('Origin-Agent-Cluster', '?1');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  if (env.nodeEnv === 'production') response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

export function corsAllowlist(request, response, next) {
  const origin = request.get('Origin');
  response.vary('Origin');

  if (origin && !env.clientOrigins.includes(origin)) {
    return response.status(403).json({
      error: { code: 'CORS_ORIGIN_DENIED', message: 'This browser origin is not allowed.', requestId: request.id },
    });
  }

  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Max-Age', '600');
  }

  if (request.method === 'OPTIONS') return response.status(204).end();
  next();
}

export function createRateLimiter({ windowMs = env.rateLimitWindowMs, maxRequests = env.rateLimitMaxRequests } = {}) {
  const clients = new Map();

  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    let record = clients.get(key);
    if (!record || record.resetAt <= now) {
      record = { count: 0, resetAt: now + windowMs };
      clients.set(key, record);
    }

    record.count += 1;
    response.setHeader('RateLimit-Limit', String(maxRequests));
    response.setHeader('RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
    response.setHeader('RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

    if (record.count > maxRequests) {
      response.setHeader('Retry-After', String(Math.max(1, Math.ceil((record.resetAt - now) / 1000))));
      return response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Wait a little while, then try again.',
          requestId: request.id,
        },
      });
    }

    if (clients.size > 10000) {
      for (const [clientKey, clientRecord] of clients) {
        if (clientRecord.resetAt <= now) clients.delete(clientKey);
      }
      while (clients.size > 10000) clients.delete(clients.keys().next().value);
    }

    next();
  };
}

export function requestLogger(request, response, next) {
  const startedAt = Date.now();
  request.originalPath = request.path;
  response.once('finish', () => {
    console.info(JSON.stringify({
      requestId: request.id,
      method: request.method,
      path: request.originalPath,
      status: response.statusCode,
      durationMs: Date.now() - startedAt,
    }));
  });
  next();
}
