import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { CaseModel } from '../models/Case.js';
import { CaseSolutionModel } from '../models/CaseSolution.js';
import { GameSessionModel } from '../models/GameSession.js';
import { formatValidationIssues, generatedMysterySchema, validateMysteryReferences } from '../schemas/case-generation.schema.js';
import { GeminiConfigurationError, GeminiProviderError, isRetryableGeminiError, requestMysteryFromGemini } from './gemini.service.js';

const MAX_REPAIR_RETRIES = 2;

export class CaseGenerationFailedError extends Error {
  constructor(validationErrors = []) {
    super('Gemini returned a case that did not pass validation.');
    this.name = 'CaseGenerationFailedError';
    this.code = 'CASE_GENERATION_FAILED';
    this.validationErrors = validationErrors;
  }
}

export class GeneratedCasePersistenceError extends Error {
  constructor(cause) {
    super('The generated case could not be saved.', { cause });
    this.name = 'GeneratedCasePersistenceError';
    this.code = 'CASE_PERSISTENCE_FAILED';
  }
}

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function normalizeGeneratedArtifactContent(candidate) {
  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.evidence)) return candidate;

  for (const item of candidate.evidence) {
    if (!item || typeof item !== 'object') continue;

    const currentLabel = typeof item.fictionalLabel === 'string' ? item.fictionalLabel.trim() : '';
    if (item.type === 'chat' && !/simulated chat/i.test(currentLabel)) {
      item.fictionalLabel = `Simulated chat — ${currentLabel || 'fictional evidence for this game'}`;
    } else if (item.type === 'cctv_transcript' && !/simulated.*not real footage/i.test(currentLabel)) {
      item.fictionalLabel = `Simulated CCTV transcript; not real footage — ${currentLabel || 'fictional evidence for this game'}`;
    } else if (!/fictional|simulated/i.test(currentLabel)) {
      item.fictionalLabel = `Fictional evidence — ${currentLabel || 'created for this game'}`;
    }

    const content = item?.content;
    if (!content || typeof content !== 'object' || Array.isArray(content)) continue;

    if (item.type === 'image' && typeof content.visibleDetails === 'string') {
      content.visibleDetails = [content.visibleDetails.trim()].filter(Boolean);
    }

    if (item.type === 'cctv_transcript') {
      if (Array.isArray(content.transcript)) {
        content.transcript = content.transcript.map((entry) => (
          typeof entry === 'string' ? { observation: entry } : entry
        ));
      }
      if (typeof content.limitations === 'string') {
        content.limitations = [content.limitations.trim()].filter(Boolean);
      }

      if (content.intervalTimes !== undefined) {
        const intervalTimes = content.intervalTimes;
        if (Array.isArray(intervalTimes)) {
          if (intervalTimes[0] !== undefined) content.intervalStart = String(intervalTimes[0]);
          if (intervalTimes[1] !== undefined) content.intervalEnd = String(intervalTimes[1]);
        } else if (intervalTimes && typeof intervalTimes === 'object') {
          if (intervalTimes.start !== undefined) content.intervalStart = String(intervalTimes.start);
          if (intervalTimes.end !== undefined) content.intervalEnd = String(intervalTimes.end);
        } else if (typeof intervalTimes === 'string') {
          const parts = intervalTimes.split(/\s+(?:to|through)\s+|\s*[–—]\s*|\s+-\s+/i);
          content.intervalStart = parts[0].trim();
          if (parts[1]) content.intervalEnd = parts.slice(1).join(' - ').trim();
        }
        delete content.intervalTimes;
      }
    }
  }

  return candidate;
}

export async function generateMystery(request) {
  if (!env.geminiApiKey) throw new GeminiConfigurationError();

  let validationErrors = [];
  let lastProviderError;

  for (let attempt = 0; attempt <= MAX_REPAIR_RETRIES; attempt += 1) {
    let responseText;
    try {
      responseText = await requestMysteryFromGemini(request, validationErrors);
      lastProviderError = null;
    } catch (providerError) {
      lastProviderError = providerError;
      if (!isRetryableGeminiError(providerError) || attempt === MAX_REPAIR_RETRIES) {
        throw new GeminiProviderError(providerError);
      }
      await pause(500 * (2 ** attempt));
      continue;
    }

    let candidate;
    try {
      candidate = normalizeGeneratedArtifactContent(JSON.parse(responseText));
    } catch {
      validationErrors = ['response: return exactly one complete JSON object without Markdown or commentary.'];
      continue;
    }

    const parsed = generatedMysterySchema.safeParse(candidate);
    if (!parsed.success) {
      validationErrors = formatValidationIssues(parsed.error.issues);
      continue;
    }

    validationErrors = validateMysteryReferences(parsed.data, request);
    if (validationErrors.length === 0) return parsed.data;
  }

  if (lastProviderError) throw new GeminiProviderError(lastProviderError);
  throw new CaseGenerationFailedError(validationErrors);
}

export async function persistGeneratedMystery(mystery, request) {
  const caseId = `case_${randomUUID().replaceAll('-', '')}`;
  let caseRecord;

  try {
    caseRecord = await CaseModel.create({
      id: caseId,
      title: mystery.title,
      premise: request.premise,
      summary: mystery.summary,
      incidentType: mystery.incidentType,
      setting: mystery.setting,
      incidentTime: mystery.incidentTime,
      difficulty: request.difficulty,
      tone: request.tone,
      playTimeMinutes: request.playTimeMinutes,
      status: 'archived',
      suspects: mystery.suspects,
      evidence: mystery.evidence,
      timeline: mystery.timeline,
      generation: {
        provider: 'gemini',
        model: env.geminiModel,
        schemaVersion: '1.0',
      },
    });

    await CaseSolutionModel.create({
      caseId: caseRecord._id,
      ...mystery.solution,
      timelineReconstruction: mystery.timeline.map((event) => ({
        timestamp: event.timestamp ?? event.approximateTime,
        description: event.description,
      })),
    });

    caseRecord.status = 'ready';
    await caseRecord.save();
    return caseRecord.toObject();
  } catch (cause) {
    if (caseRecord) await removeGeneratedMystery(caseRecord).catch(() => {});
    throw new GeneratedCasePersistenceError(cause);
  }
}

export async function removeGeneratedMystery(caseRecord) {
  const caseObjectId = caseRecord?._id;
  if (!caseObjectId) return;

  await Promise.all([
    CaseSolutionModel.deleteOne({ caseId: caseObjectId }),
    GameSessionModel.deleteMany({ caseId: caseObjectId }),
    CaseModel.deleteOne({ _id: caseObjectId }),
  ]);
}
