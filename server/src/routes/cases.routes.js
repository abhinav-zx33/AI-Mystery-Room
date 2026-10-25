import { Router } from 'express';
import { demoCase } from '../data/demo-case.public.js';
import { createDemoSession, findDemoSession, submitDemoAccusation } from '../services/demo-game.service.js';
import { serializePublicCase } from '../serializers/public-case.serializer.js';
import { serializeResult } from '../serializers/result.serializer.js';

export const casesRouter = Router();

function error(response, status, code, message) {
  return response.status(status).json({ error: { code, message } });
}

function checkCase(caseId, response) {
  if (caseId === demoCase.id) return true;
  error(response, 404, 'CASE_NOT_FOUND', 'This case is not available.');
  return false;
}

casesRouter.get('/:caseId', (request, response) => {
  if (!checkCase(request.params.caseId, response)) return;
  response.json({ case: serializePublicCase(demoCase) });
});

casesRouter.post('/:caseId/sessions', (request, response) => {
  if (!checkCase(request.params.caseId, response)) return;
  const session = createDemoSession(request.params.caseId);
  response.status(201).json({
    session: { id: session.id, caseId: session.caseId, status: session.status },
  });
});

casesRouter.get('/:caseId/session', (request, response) => {
  if (!checkCase(request.params.caseId, response)) return;
  const sessionId = request.query.sessionId;
  if (typeof sessionId !== 'string' || !sessionId) {
    return error(response, 400, 'SESSION_NOT_FOUND', 'A valid case session is required.');
  }
  const session = findDemoSession(request.params.caseId, sessionId);
  if (!session) return error(response, 404, 'SESSION_NOT_FOUND', 'This case session is not available.');

  return response.json({
    session: {
      id: session.id,
      caseId: session.caseId,
      status: session.status,
      accusation: session.accusation ? { suspectId: session.accusation.suspectId } : null,
    },
  });
});

casesRouter.post('/:caseId/accusation', (request, response) => {
  const { caseId } = request.params;
  if (!checkCase(caseId, response)) return;
  const { sessionId, suspectId } = request.body ?? {};
  if (typeof sessionId !== 'string' || typeof suspectId !== 'string') {
    return error(response, 400, 'VALIDATION_ERROR', 'Choose one suspect and submit a valid case session.');
  }

  const submission = submitDemoAccusation(caseId, sessionId, suspectId);
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

casesRouter.get('/:caseId/result', (request, response) => {
  if (!checkCase(request.params.caseId, response)) return;
  const sessionId = request.query.sessionId;
  if (typeof sessionId !== 'string' || !sessionId) {
    return error(response, 400, 'SESSION_NOT_FOUND', 'A valid case session is required.');
  }
  const session = findDemoSession(request.params.caseId, sessionId);
  if (!session) return error(response, 404, 'SESSION_NOT_FOUND', 'This case session is not available.');
  if (session.status !== 'resolved') {
    return error(response, 409, 'RESULT_NOT_AVAILABLE', 'Submit your final accusation to reveal the solution.');
  }

  return response.json({ result: serializeResult(session) });
});
