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

const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri || !/^mongodb(?:\+srv)?:\/\//.test(mongodbUri)) {
  throw new Error('MONGODB_URI is required and must be a MongoDB connection URI.');
}

const sessionTokenSecret = process.env.SESSION_TOKEN_SECRET;
if (!sessionTokenSecret || sessionTokenSecret.length < 32) {
  throw new Error('SESSION_TOKEN_SECRET is required and must contain at least 32 characters. Generate a random secret for local development.');
}

export const env = Object.freeze({
  nodeEnv,
  port: positiveInteger(process.env.PORT, 'PORT', 5000),
  clientOrigin,
  mongodbUri,
  sessionTokenSecret,
});
