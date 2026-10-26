import { createHmac, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';
import { CaseModel } from '../models/Case.js';
import { CaseSolutionModel } from '../models/CaseSolution.js';
import { GameSessionModel } from '../models/GameSession.js';

function hashSessionToken(token) {
  return createHmac('sha256', env.sessionTokenSecret).update(token).digest('hex');
}

export function getCaseRecord(caseId) {
  return CaseModel.findOne({ id: caseId }).lean();
}

export async function createDemoSession(caseId) {
  const caseRecord = await getCaseRecord(caseId);
  if (!caseRecord || caseRecord.status !== 'ready') return null;

  const sessionToken = randomBytes(32).toString('base64url');
  await GameSessionModel.create({
    caseId: caseRecord._id,
    sessionTokenHash: hashSessionToken(sessionToken),
    status: 'in_progress',
  });

  return { id: sessionToken, caseId, status: 'in_progress' };
}

export async function findDemoSession(caseId, sessionToken) {
  const caseRecord = await getCaseRecord(caseId);
  if (!caseRecord || typeof sessionToken !== 'string' || sessionToken.length > 128) return null;

  const sessionRecord = await GameSessionModel.findOne({
    caseId: caseRecord._id,
    sessionTokenHash: hashSessionToken(sessionToken),
  }).lean();

  return sessionRecord ? { caseRecord, sessionRecord } : null;
}

export async function submitDemoAccusation(caseId, sessionToken, suspectId) {
  const resolvedSession = await findDemoSession(caseId, sessionToken);
  if (!resolvedSession) return { kind: 'session_not_found' };

  const { caseRecord, sessionRecord } = resolvedSession;
  if (!caseRecord.suspects.some((suspect) => suspect.id === suspectId)) {
    return { kind: 'invalid_suspect' };
  }
  if (sessionRecord.status === 'resolved') {
    return { kind: 'already_resolved', session: sessionRecord };
  }

  const solution = await CaseSolutionModel.findOne({ caseId: caseRecord._id }).lean();
  if (!solution) throw new Error('The case solution is missing from persistence.');

  const accusation = {
    suspectId,
    isCorrect: suspectId === solution.culpritId,
    submittedAt: new Date(),
  };
  const updatedSession = await GameSessionModel.findOneAndUpdate(
    { _id: sessionRecord._id, status: 'in_progress' },
    { $set: { status: 'resolved', accusation } },
    { new: true },
  ).lean();

  if (updatedSession) return { kind: 'resolved', session: updatedSession };

  const latestSession = await GameSessionModel.findById(sessionRecord._id).lean();
  if (latestSession?.status === 'resolved') {
    return { kind: 'already_resolved', session: latestSession };
  }
  throw new Error('The accusation could not be recorded.');
}

export async function getDemoResult(caseId, sessionToken) {
  const resolvedSession = await findDemoSession(caseId, sessionToken);
  if (!resolvedSession) return { kind: 'session_not_found' };
  if (resolvedSession.sessionRecord.status !== 'resolved') return { kind: 'result_not_available' };

  const solution = await CaseSolutionModel.findOne({ caseId: resolvedSession.caseRecord._id }).lean();
  if (!solution) throw new Error('The case solution is missing from persistence.');

  return {
    kind: 'resolved',
    session: resolvedSession.sessionRecord,
    caseRecord: resolvedSession.caseRecord,
    solution,
  };
}
