import { randomUUID } from 'node:crypto';
import { demoCase } from '../data/demo-case.public.js';
import { demoCaseSolution } from '../data/demo-case.solution.js';

const sessions = new Map();

export function createDemoSession(caseId) {
  if (caseId !== demoCase.id) return null;

  const session = {
    id: randomUUID(),
    caseId,
    status: 'in_progress',
    accusation: null,
    createdAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function findDemoSession(caseId, sessionId) {
  const session = sessions.get(sessionId);
  return session?.caseId === caseId ? session : null;
}

export function submitDemoAccusation(caseId, sessionId, suspectId) {
  const session = findDemoSession(caseId, sessionId);
  if (!session) return { kind: 'session_not_found' };
  if (!demoCase.suspects.some((suspect) => suspect.id === suspectId)) {
    return { kind: 'invalid_suspect' };
  }
  if (session.accusation) return { kind: 'already_resolved', session };

  session.status = 'resolved';
  session.accusation = {
    suspectId,
    isCorrect: suspectId === demoCaseSolution.culpritId,
    submittedAt: new Date().toISOString(),
  };
  return { kind: 'resolved', session };
}
