const CASE_ID = 'demo-case-001';
const casePath = (caseId) => `/api/v1/cases/${encodeURIComponent(caseId)}`;

async function request(path, options = {}, allowConflict = false) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error('The case desk cannot be reached right now. Check that the server is running and try again.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !(allowConflict && response.status === 409)) {
    throw new Error(payload.error?.message ?? 'That request could not be completed. Please try again.');
  }
  return { ...payload, statusCode: response.status };
}

export const demoCaseId = CASE_ID;

export async function getCase(caseId = CASE_ID) {
  const payload = await request(casePath(caseId));
  return payload.case;
}

export async function createSession(caseId = CASE_ID) {
  const payload = await request(`${casePath(caseId)}/sessions`, { method: 'POST' });
  return payload.session;
}

export async function getSession(sessionId, caseId = CASE_ID) {
  const payload = await request(`${casePath(caseId)}/session?sessionId=${encodeURIComponent(sessionId)}`);
  return payload.session;
}

export async function submitAccusation(sessionId, suspectId, caseId = CASE_ID) {
  const payload = await request(`${casePath(caseId)}/accusation`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, suspectId }),
  }, true);
  return payload.result;
}

export async function getResult(sessionId, caseId = CASE_ID) {
  const payload = await request(`${casePath(caseId)}/result?sessionId=${encodeURIComponent(sessionId)}`);
  return payload.result;
}
