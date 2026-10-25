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

const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
try {
  new URL(clientOrigin);
} catch {
  throw new Error('CLIENT_ORIGIN must be a valid absolute URL.');
}

export const env = Object.freeze({
  nodeEnv,
  port: positiveInteger(process.env.PORT, 'PORT', 5000),
  clientOrigin,
});
