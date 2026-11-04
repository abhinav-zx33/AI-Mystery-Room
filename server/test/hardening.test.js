import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tracebit_test';
process.env.SESSION_TOKEN_SECRET = 'tracebit-test-session-secret-at-least-32-characters';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '2';

const { app } = await import('../src/app.js');
const { serializePublicCase } = await import('../src/serializers/public-case.serializer.js');
const { getDemoResult } = await import('../src/services/demo-game.service.js');
const { CaseModel } = await import('../src/models/Case.js');
const { CaseSolutionModel } = await import('../src/models/CaseSolution.js');
const { GameSessionModel } = await import('../src/models/GameSession.js');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('public case serialization omits all hidden solution fields', () => {
  const source = {
    id: 'case_test_001',
    title: 'The Missing Clock',
    summary: 'A fictional case.',
    incidentType: 'theft',
    setting: 'A museum',
    incidentTime: 'Friday evening',
    difficulty: 'easy',
    playTimeMinutes: 5,
    status: 'ready',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    suspects: [],
    evidence: [],
    timeline: [],
    solution: { culpritId: 'suspect_secret', explanation: 'Hidden answer.' },
    culpritId: 'suspect_secret',
  };

  const serialized = serializePublicCase(source);
  assert.equal(Object.hasOwn(serialized, 'solution'), false);
  assert.equal(Object.hasOwn(serialized, 'culpritId'), false);
  assert.equal(JSON.stringify(serialized).includes('suspect_secret'), false);
});

test('API responses include a request ID and security headers', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id'), /^[0-9a-f-]{36}$/i);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('CORS rejects an origin outside the configured allowlist', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`, {
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, 'CORS_ORIGIN_DENIED');
});

test('malformed JSON and oversized request bodies receive client errors', async () => {
  const malformed = await fetch(`${baseUrl}/api/v1/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{invalid',
  });
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, 'VALIDATION_ERROR');

  const oversized = await fetch(`${baseUrl}/api/v1/health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(33 * 1024) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.code, 'PAYLOAD_TOO_LARGE');
});

test('result access requires a well-formed session token', async () => {
  const response = await fetch(`${baseUrl}/api/v1/cases/demo-case-001/result`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'SESSION_NOT_FOUND');
});

test('accusation input is validated before session lookup', async () => {
  const response = await fetch(`${baseUrl}/api/v1/cases/demo-case-001/accusation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'short', suspectId: 'suspect_one', culpritId: 'suspect_one' }),
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
});

test('an unresolved or unauthorized session cannot load the hidden solution', async () => {
  const originals = {
    caseFindOne: CaseModel.findOne,
    sessionFindOne: GameSessionModel.findOne,
    solutionFindOne: CaseSolutionModel.findOne,
  };
  const caseRecord = { _id: 'test-case-id', id: 'case_test_001', status: 'ready' };
  let solutionWasRead = false;

  try {
    CaseModel.findOne = () => ({ lean: async () => caseRecord });
    GameSessionModel.findOne = () => ({ lean: async () => ({ status: 'in_progress' }) });
    CaseSolutionModel.findOne = () => {
      solutionWasRead = true;
      return { lean: async () => ({ culpritId: 'secret' }) };
    };

    const unresolved = await getDemoResult('case_test_001', 'A'.repeat(43));
    assert.equal(unresolved.kind, 'result_not_available');
    assert.equal(solutionWasRead, false);

    GameSessionModel.findOne = () => ({ lean: async () => null });
    const unauthorized = await getDemoResult('case_test_001', 'B'.repeat(43));
    assert.equal(unauthorized.kind, 'session_not_found');
    assert.equal(solutionWasRead, false);
  } finally {
    CaseModel.findOne = originals.caseFindOne;
    GameSessionModel.findOne = originals.sessionFindOne;
    CaseSolutionModel.findOne = originals.solutionFindOne;
  }
});

test('case IDs are validated before database access', async () => {
  const response = await fetch(`${baseUrl}/api/v1/cases/invalid%20case`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'VALIDATION_ERROR');
});

test('case generation requests are rate limited', async () => {
  const submit = () => fetch(`${baseUrl}/api/v1/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal((await submit()).status, 400);
  assert.equal((await submit()).status, 400);
  const limited = await submit();
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).error.code, 'RATE_LIMITED');
  assert.ok(Number(limited.headers.get('retry-after')) >= 1);
});
