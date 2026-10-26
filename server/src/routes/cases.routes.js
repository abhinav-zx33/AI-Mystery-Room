import { Router } from 'express';
import { createDemoSession, findDemoSession, getCaseRecord, getDemoResult, submitDemoAccusation } from '../services/demo-game.service.js';
import { serializePublicCase } from '../serializers/public-case.serializer.js';
import { serializeResult } from '../serializers/result.serializer.js';

export const casesRouter = Router();

function error(response, status, code, message) {
  return response.status(status).json({ error: { code, message } });
}

casesRouter.get('/:caseId', async (request, response) => {
  const caseRecord = await getCaseRecord(request.params.caseId);
  if (!caseRecord || caseRecord.status !== 'ready') {
    return error(response, 404, 'CASE_NOT_FOUND', 'This case is not available.');
  }
  return response.json({ case: serializePublicCase(caseRecord) });
});

casesRouter.post('/:caseId/sessions', async (request, response) => {
  const session = await createDemoSession(request.params.caseId);
  if (!session) return error(response, 404, 'CASE_NOT_FOUND', 'This case is not available.');
  return response.status(201).json({ session });
});

casesRouter.get('/:caseId/session', async (request, response) => {
  const sessionToken = request.query.sessionId;
  if (typeof sessionToken !== 'string' || !sessionToken) {
    return error(response, 400, 'SESSION_NOT_FOUND', 'A valid case session is required.');
  }
  const resolvedSession = await findDemoSession(request.params.caseId, sessionToken);
  if (!resolvedSession) return error(response, 404, 'SESSION_NOT_FOUND', 'This case session is not available.');

  const { caseRecord, sessionRecord } = resolvedSession;
  return response.json({
    session: {
      id: sessionToken,
      caseId: caseRecord.id,
      status: sessionRecord.status,
      accusation: sessionRecord.accusation ? { suspectId: sessionRecord.accusation.suspectId } : null,
    },
  });
});

casesRouter.post('/:caseId/accusation', async (request, response) => {
  const { sessionId, suspectId } = request.body ?? {};
  if (typeof sessionId !== 'string' || typeof suspectId !== 'string') {
    return error(response, 400, 'VALIDATION_ERROR', 'Choose one suspect and submit a valid case session.');
  }

  const submission = await submitDemoAccusation(request.params.caseId, sessionId, suspectId);
  if (submission.kind === 'session_not_found') {
    return error(response, 404, 'SESSION_NOT_FOUND', 'This case session is not available.');
  }
  if (submission.kind === 'invalid_suspect') {
    return error(response, 400, 'INVALID_SUSPECT', 'Choose a suspect listed in this case.');
  }

  const { session } = submission;
  return response.status(submission.kind === 'already_resolved' ? 409 : 200).json({
    result: {
      isCorrect: session.accusation.isCorrect,
      score: session.accusation.isCorrect ? 100 : 0,
      submittedSuspectId: session.accusation.suspectId,
      attemptsUsed: 1,
      status: 'resolved',
    },
  });
});

casesRouter.get('/:caseId/result', async (request, response) => {
  const sessionToken = request.query.sessionId;
  if (typeof sessionToken !== 'string' || !sessionToken) {
    return error(response, 400, 'SESSION_NOT_FOUND', 'A valid case session is required.');
  }
  const result = await getDemoResult(request.params.caseId, sessionToken);
  if (result.kind === 'session_not_found') {
    return error(response, 404, 'SESSION_NOT_FOUND', 'This case session is not available.');
  }
  if (result.kind === 'result_not_available') {
    return error(response, 409, 'RESULT_NOT_AVAILABLE', 'Submit your final accusation to reveal the solution.');
  }

  return response.json({ result: serializeResult(result.caseRecord, result.solution, result.session) });
});
