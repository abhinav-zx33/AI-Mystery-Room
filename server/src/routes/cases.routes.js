import { Router } from 'express';
import { createDemoSession, createSessionForCaseRecord, findDemoSession, getCaseRecord, getDemoResult, submitDemoAccusation } from '../services/demo-game.service.js';
import { env } from '../config/env.js';
import { createCaseRequestSchema, formatValidationIssues } from '../schemas/case-generation.schema.js';
import { CaseGenerationFailedError, GeneratedCasePersistenceError, generateMystery, persistGeneratedMystery, removeGeneratedMystery } from '../services/case-generation.service.js';
import { GeminiConfigurationError, GeminiProviderError, isQuotaExhaustedGeminiError } from '../services/gemini.service.js';
import { serializePublicCase } from '../serializers/public-case.serializer.js';
import { serializeResult } from '../serializers/result.serializer.js';

export const casesRouter = Router();

function error(response, status, code, message, details) {
  return response.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

casesRouter.post('/', async (request, response) => {
  const parsedRequest = createCaseRequestSchema.safeParse(request.body);
  if (!parsedRequest.success) {
    return error(response, 400, 'VALIDATION_ERROR', 'Review the premise and settings, then try again.', formatValidationIssues(parsedRequest.error.issues));
  }

  let caseRecord;
  try {
    const mystery = await generateMystery(parsedRequest.data);
    caseRecord = await persistGeneratedMystery(mystery, parsedRequest.data);

    const session = await createSessionForCaseRecord(caseRecord);
    if (!session) throw new Error('A session could not be created for the new case.');

    return response.status(201).json({ case: serializePublicCase(caseRecord), session });
  } catch (failure) {
    if (caseRecord) await removeGeneratedMystery(caseRecord).catch(() => {});
    const providerStatus = Number(failure.cause?.status ?? failure.cause?.statusCode);
    const providerCode = String(failure.cause?.code ?? '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
    const rawProviderMessage = String(failure.cause?.message ?? '');
    const providerMessage = (env.geminiApiKey
      ? rawProviderMessage.replaceAll(env.geminiApiKey, '[redacted]')
      : rawProviderMessage)
      .replace(/AIza[\w-]{20,}/g, '[redacted]')
      .replace(/\s+/g, ' ')
      .slice(0, 240);
    console.error(
      `[case-generation] ${failure.name ?? 'Error'}`
      + (Number.isInteger(providerStatus) && providerStatus > 0 ? ` status=${providerStatus}` : '')
      + (providerCode ? ` code=${providerCode}` : '')
      + (providerMessage ? ` detail=${providerMessage}` : ''),
    );

    if (failure instanceof GeminiConfigurationError) {
      const message = env.nodeEnv === 'development'
        ? failure.message
        : 'Mystery generation is not available right now.';
      return error(response, 503, 'AI_PROVIDER_UNAVAILABLE', message);
    }
    if (failure instanceof GeminiProviderError) {
      if (providerStatus === 429 && isQuotaExhaustedGeminiError(failure.cause)) {
        return error(response, 429, 'AI_QUOTA_EXCEEDED', 'Gemini reports that this project has reached its current quota. Check usage and limits in Google AI Studio, then wait for the quota to reset or review billing settings.');
      }
      if (providerStatus === 429) {
        return error(response, 429, 'AI_RATE_LIMITED', 'Gemini is receiving requests too quickly. Wait a short while before trying again.');
      }
      return error(response, 503, 'AI_PROVIDER_UNAVAILABLE', 'The mystery service is temporarily unavailable. Please try again.');
    }
    if (failure instanceof CaseGenerationFailedError) {
      const details = failure.validationErrors.slice(0, 8);
      if (details.length) console.error(`[case-generation] validation=${details.join(' | ').slice(0, 700)}`);
      return error(
        response,
        502,
        'CASE_GENERATION_FAILED',
        env.nodeEnv === 'development'
          ? 'Gemini returned a case that failed consistency checks.'
          : 'The case could not be made consistent. Please try a different premise.',
        env.nodeEnv === 'development' ? details : undefined,
      );
    }
    if (failure instanceof GeneratedCasePersistenceError) {
      return error(response, 500, 'INTERNAL_ERROR', 'The case could not be saved. Please try again.');
    }
    return error(response, 500, 'INTERNAL_ERROR', 'The request could not be completed. Please try again.');
  }
});

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
