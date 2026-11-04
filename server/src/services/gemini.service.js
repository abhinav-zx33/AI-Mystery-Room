import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { env } from '../config/env.js';
import { generatedMysteryJsonSchema } from '../schemas/case-generation.schema.js';
import { buildGenerationPrompt, generationSystemInstruction } from '../prompts/generate-case.prompt.js';

export class GeminiConfigurationError extends Error {
  constructor() {
    super('Gemini generation is not configured. Add GEMINI_API_KEY to server/.env and restart the server.');
    this.name = 'GeminiConfigurationError';
    this.code = 'GEMINI_NOT_CONFIGURED';
  }
}

export class GeminiProviderError extends Error {
  constructor(cause) {
    super('Gemini could not complete the generation request.', { cause });
    this.name = 'GeminiProviderError';
    this.code = 'AI_PROVIDER_UNAVAILABLE';
  }
}

export function isQuotaExhaustedGeminiError(error) {
  const message = `${error?.message ?? ''} ${error?.cause?.message ?? ''}`;
  return /quota.{0,100}(?:exceeded|exhausted)|(?:exceeded|exhausted).{0,100}quota/i.test(message);
}

export function isRetryableGeminiError(error) {
  const status = Number(error?.status ?? error?.statusCode ?? error?.cause?.status);
  if (status === 429 && isQuotaExhaustedGeminiError(error)) return false;
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;

  const code = String(error?.code ?? error?.cause?.code ?? '').toUpperCase();
  return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)
    || /timeout|network|fetch failed/i.test(String(error?.message ?? ''));
}

export async function requestMysteryFromGemini(request, validationErrors = []) {
  if (!env.geminiApiKey) throw new GeminiConfigurationError();

  const client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  const response = await client.models.generateContent({
    model: env.geminiModel,
    contents: buildGenerationPrompt(request, validationErrors),
    config: {
      systemInstruction: generationSystemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: generatedMysteryJsonSchema,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      maxOutputTokens: 12000,
      httpOptions: { timeout: 120000 },
    },
  });

  return response.text ?? '';
}
