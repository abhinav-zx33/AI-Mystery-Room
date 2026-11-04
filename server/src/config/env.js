import dotenv from 'dotenv';

dotenv.config();

function positiveInteger(value, name, fallback) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${name} must be a positive integer no greater than 65535.`);
  }
  return parsed;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production.');
}

const configuredClientOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (configuredClientOrigins.length === 0) throw new Error('CLIENT_ORIGIN must contain at least one allowed origin.');
const clientOrigins = new Set();
for (const origin of configuredClientOrigins) {
  try {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || !['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    clientOrigins.add(origin);
  } catch {
    throw new Error('CLIENT_ORIGIN must be a comma-separated list of valid origins without paths.');
  }
}
if (nodeEnv !== 'production') {
  clientOrigins.add('http://localhost:5174');
  clientOrigins.add('http://127.0.0.1:5173');
  clientOrigins.add('http://127.0.0.1:5174');
}

function boundedInteger(value, name, fallback, maximum) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }
  return parsed;
}

const rateLimitWindowMs = boundedInteger(process.env.RATE_LIMIT_WINDOW_MS, 'RATE_LIMIT_WINDOW_MS', 60000, 3600000);
const rateLimitMaxRequests = boundedInteger(process.env.RATE_LIMIT_MAX_REQUESTS, 'RATE_LIMIT_MAX_REQUESTS', 20, 10000);

const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri || !/^mongodb(?:\+srv)?:\/\//.test(mongodbUri)) {
  throw new Error('MONGODB_URI is required and must be a MongoDB connection URI.');
}

const geminiApiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.6-flash';

const sessionTokenSecret = process.env.SESSION_TOKEN_SECRET;
if (!sessionTokenSecret || sessionTokenSecret.length < 32) {
  throw new Error('SESSION_TOKEN_SECRET is required and must contain at least 32 characters. Generate a random secret for local development.');
}

export const env = Object.freeze({
  nodeEnv,
  port: positiveInteger(process.env.PORT, 'PORT', 5000),
  clientOrigins: [...clientOrigins],
  mongodbUri,
  geminiApiKey,
  geminiModel,
  sessionTokenSecret,
  rateLimitWindowMs,
  rateLimitMaxRequests,
});
