import { z } from 'zod';

export const EVIDENCE_TYPES = [
  'chat',
  'image',
  'cctv_transcript',
  'document',
  'witness_statement',
  'timeline',
];

export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const TONES = ['classic_detective', 'suspense', 'lighthearted', 'noir'];
export const PLAY_TIMES = [5, 10, 15, 20];

const allEvidenceTypes = [...EVIDENCE_TYPES];
const idSchema = z.string().trim().min(2).max(64).regex(/^[a-z0-9][a-z0-9_-]*$/i);
const text = (maximum = 1200, minimum = 1) => z.string().trim().min(minimum).max(maximum);
const isoDateTime = z.string().refine((value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)), 'Must be a valid ISO 8601 date and time with timezone.');
const stringArray = (maximum = 12) => z.array(text(240)).max(maximum);

const chatContent = z.object({
  participants: z.array(text(80)).min(2).max(8),
  messages: z.array(z.object({
    timestamp: text(80).optional(),
    sender: text(80),
    text: text(700),
  }).strict()).min(2).max(24),
}).strict();

const imageContent = z.object({
  altText: text(300),
  caption: text(500),
  visibleDetails: stringArray(10).min(1),
  generationStatus: z.literal('placeholder'),
}).strict();

const cctvContent = z.object({
  cameraLabel: text(100),
  intervalStart: text(80).optional(),
  intervalEnd: text(80).optional(),
  transcript: z.array(z.object({
    timestamp: text(80).optional(),
    observation: text(500),
  }).strict()).min(1).max(12),
  limitations: stringArray(8).min(1),
}).strict();

const documentContent = z.object({
  documentType: text(100),
  text: text(1400),
  fields: z.array(z.object({ label: text(100), value: text(300) }).strict()).max(16).optional(),
}).strict();

const witnessContent = z.object({
  witnessName: text(100),
  statement: text(1200),
  confidence: z.enum(['high', 'medium', 'low']),
}).strict();

const timelineContent = z.object({
  events: z.array(z.object({
    timestamp: text(80).optional(),
    description: text(400),
  }).strict()).min(1).max(12),
}).strict();

const evidenceBase = {
  id: idSchema,
  title: text(140),
  timestamp: isoDateTime.optional(),
  description: text(700),
  sourceContext: text(500),
  relatedSuspectIds: z.array(idSchema).max(5),
  relatedEventIds: z.array(idSchema).max(20),
  reliability: z.enum(['high', 'medium', 'low']),
  reliabilityReason: text(500),
  fictionalLabel: text(100),
};

const evidenceSchemas = [
  z.object({ ...evidenceBase, type: z.literal('chat'), content: chatContent }).strict(),
  z.object({ ...evidenceBase, type: z.literal('image'), content: imageContent }).strict(),
  z.object({ ...evidenceBase, type: z.literal('cctv_transcript'), content: cctvContent }).strict(),
  z.object({ ...evidenceBase, type: z.literal('document'), content: documentContent }).strict(),
  z.object({ ...evidenceBase, type: z.literal('witness_statement'), content: witnessContent }).strict(),
  z.object({ ...evidenceBase, type: z.literal('timeline'), content: timelineContent }).strict(),
];

const suspectSchema = z.object({
  id: idSchema,
  name: text(100),
  role: text(140),
  profile: text(700),
  statedAlibi: text(500),
  apparentMotive: text(500),
}).strict();

const timelineEventSchema = z.object({
  id: idSchema,
  timestamp: isoDateTime.optional(),
  approximateTime: text(120).optional(),
  description: text(600),
  relatedSuspectIds: z.array(idSchema).max(5),
  relatedEvidenceIds: z.array(idSchema).max(20),
  certainty: z.enum(['confirmed', 'estimated', 'disputed']),
}).strict().refine((event) => Boolean(event.timestamp || event.approximateTime), {
  message: 'Each timeline event needs a timestamp or an approximate time.',
});

const solutionSchema = z.object({
  culpritId: idSchema,
  explanation: text(1800),
  motive: text(700),
  opportunity: text(700),
  method: text(700),
  evidenceChain: z.array(z.object({
    evidenceId: idSchema,
    deduction: text(600),
    strength: z.enum(['decisive', 'supporting', 'context']),
  }).strict()).min(2).max(12),
  suspectClearance: z.array(z.object({
    suspectId: idSchema,
    explanation: text(700),
  }).strict()).min(2).max(4),
  internalConsistencyNotes: z.array(text(300)).min(1).max(8),
}).strict();

export const createCaseRequestSchema = z.object({
  premise: z.string().trim().min(30, 'Enter a premise of at least 30 characters.').max(1500, 'Keep the premise under 1,500 characters.'),
  difficulty: z.enum(DIFFICULTIES).default('medium'),
  tone: z.enum(TONES).default('classic_detective'),
  setting: z.preprocess((value) => typeof value === 'string' ? value.trim() || undefined : value, z.string().max(120).optional()),
  evidenceTypes: z.array(z.enum(EVIDENCE_TYPES)).min(1).max(EVIDENCE_TYPES.length).default(allEvidenceTypes).refine((items) => new Set(items).size === items.length, 'Choose each evidence type at most once.'),
  playTimeMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]).default(10),
}).strict();

export const generatedMysterySchema = z.object({
  title: text(140),
  summary: text(900),
  incidentType: text(100),
  setting: text(220),
  incidentTime: isoDateTime,
  suspects: z.array(suspectSchema).min(3).max(5),
  evidence: z.array(z.discriminatedUnion('type', evidenceSchemas)).min(5).max(15),
  timeline: z.array(timelineEventSchema).min(3).max(15),
  solution: solutionSchema,
}).strict();

const stringSchema = { type: 'STRING' };
const idJsonSchema = { type: 'STRING', minLength: '2', maxLength: '64' };
const arraySchema = (items, minItems = 0, maxItems = 20) => ({ type: 'ARRAY', items, minItems: String(minItems), maxItems: String(maxItems) });
const objectSchema = (properties, required = Object.keys(properties)) => ({
  type: 'OBJECT',
  properties,
  required,
  propertyOrdering: Object.keys(properties),
});

const artifactContentResponseSchema = {
  anyOf: [
    objectSchema({
      participants: arraySchema(stringSchema, 2, 8),
      messages: arraySchema(objectSchema({ timestamp: stringSchema, sender: stringSchema, text: stringSchema }, ['sender', 'text']), 2, 24),
    }),
    objectSchema({
      altText: stringSchema,
      caption: stringSchema,
      visibleDetails: arraySchema(stringSchema, 1, 10),
      generationStatus: { type: 'STRING', enum: ['placeholder'] },
    }),
    objectSchema({
      cameraLabel: stringSchema,
      intervalStart: stringSchema,
      intervalEnd: stringSchema,
      transcript: arraySchema(objectSchema({ timestamp: stringSchema, observation: stringSchema }, ['observation']), 1, 12),
      limitations: arraySchema(stringSchema, 1, 8),
    }, ['cameraLabel', 'transcript', 'limitations']),
    objectSchema({
      documentType: stringSchema,
      text: stringSchema,
      fields: arraySchema(objectSchema({ label: stringSchema, value: stringSchema }), 0, 16),
    }, ['documentType', 'text']),
    objectSchema({
      witnessName: stringSchema,
      statement: stringSchema,
      confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
    }),
    objectSchema({
      events: arraySchema(objectSchema({ timestamp: stringSchema, description: stringSchema }, ['description']), 1, 12),
    }),
  ],
};

const generatedEvidenceSchema = objectSchema({
  id: idJsonSchema,
  title: stringSchema,
  type: { type: 'STRING', enum: EVIDENCE_TYPES },
  timestamp: stringSchema,
  description: stringSchema,
  content: { type: 'OBJECT', additionalProperties: true },
  sourceContext: stringSchema,
  relatedSuspectIds: arraySchema(idJsonSchema, 0, 5),
  relatedEventIds: arraySchema(idJsonSchema, 0, 20),
  reliability: { type: 'STRING', enum: ['high', 'medium', 'low'] },
  reliabilityReason: stringSchema,
  fictionalLabel: stringSchema,
});

export const generatedMysteryResponseSchema = objectSchema({
  title: stringSchema,
  summary: stringSchema,
  incidentType: stringSchema,
  setting: stringSchema,
  incidentTime: stringSchema,
  suspects: arraySchema(objectSchema({
    id: idJsonSchema,
    name: stringSchema,
    role: stringSchema,
    profile: stringSchema,
    statedAlibi: stringSchema,
    apparentMotive: stringSchema,
  }), 3, 5),
  evidence: arraySchema(generatedEvidenceSchema, 5, 15),
  timeline: arraySchema(objectSchema({
    id: idJsonSchema,
    timestamp: stringSchema,
    approximateTime: stringSchema,
    description: stringSchema,
    relatedSuspectIds: arraySchema(idJsonSchema, 0, 5),
    relatedEvidenceIds: arraySchema(idJsonSchema, 0, 20),
    certainty: { type: 'STRING', enum: ['confirmed', 'estimated', 'disputed'] },
  }, ['id', 'description', 'relatedSuspectIds', 'relatedEvidenceIds', 'certainty']), 3, 15),
  solution: objectSchema({
    culpritId: idJsonSchema,
    explanation: stringSchema,
    motive: stringSchema,
    opportunity: stringSchema,
    method: stringSchema,
    evidenceChain: arraySchema(objectSchema({
      evidenceId: idJsonSchema,
      deduction: stringSchema,
      strength: { type: 'STRING', enum: ['decisive', 'supporting', 'context'] },
    }), 2, 12),
    suspectClearance: arraySchema(objectSchema({ suspectId: idJsonSchema, explanation: stringSchema }), 2, 4),
    internalConsistencyNotes: arraySchema(stringSchema, 1, 8),
  }),
});

function convertToJsonSchema(schema) {
  if (Array.isArray(schema)) return schema.map(convertToJsonSchema);
  if (!schema || typeof schema !== 'object') return schema;

  return Object.fromEntries(Object.entries(schema)
    .filter(([key]) => !['propertyOrdering', 'minItems', 'maxItems', 'minLength', 'maxLength'].includes(key))
    .map(([key, value]) => {
    if (key === 'type' && typeof value === 'string') return [key, value.toLowerCase()];
    return [key, convertToJsonSchema(value)];
  }));
}

export const generatedMysteryJsonSchema = convertToJsonSchema(generatedMysteryResponseSchema);

function addUniqueIds(items, label, errors) {
  const ids = items.map((item) => item.id);
  if (new Set(ids).size !== ids.length) errors.push(`${label} IDs must be unique.`);
}

export function validateMysteryReferences(mystery, request) {
  const errors = [];
  const suspectIds = new Set(mystery.suspects.map(({ id }) => id));
  const evidenceIds = new Set(mystery.evidence.map(({ id }) => id));
  const eventIds = new Set(mystery.timeline.map(({ id }) => id));

  addUniqueIds(mystery.suspects, 'Suspect', errors);
  addUniqueIds(mystery.evidence, 'Evidence', errors);
  addUniqueIds(mystery.timeline, 'Timeline event', errors);

  if (!suspectIds.has(mystery.solution.culpritId)) errors.push('The solution culprit must match a listed suspect.');

  for (const item of mystery.evidence) {
    if (!request.evidenceTypes.includes(item.type)) errors.push(`Evidence type "${item.type}" was not requested.`);
    if (!/fictional|simulated/i.test(item.fictionalLabel)) errors.push(`Evidence "${item.id}" needs a fictional or simulated label.`);
    if (item.type === 'chat' && !/simulated chat/i.test(item.fictionalLabel)) errors.push(`Chat evidence "${item.id}" must be labeled as a simulated chat.`);
    if (item.type === 'cctv_transcript') {
      if (!/simulated.*not real footage/i.test(item.fictionalLabel)) errors.push(`CCTV evidence "${item.id}" must say it is simulated and not real footage.`);
      const transcriptText = item.content.transcript.map(({ observation }) => observation).join(' ');
      for (const suspect of mystery.suspects) {
        const escapedName = suspect.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const namePattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapedName}(?=$|[^\\p{L}\\p{N}])`, 'iu');
        if (namePattern.test(transcriptText)) {
          errors.push(`CCTV evidence "${item.id}" must not identify a suspect by name; keep the observation indirect.`);
          break;
        }
      }
    }
    if (item.type === 'image' && item.content.generationStatus !== 'placeholder') errors.push(`Image evidence "${item.id}" must be a placeholder because no image provider is configured.`);
    for (const id of item.relatedSuspectIds) if (!suspectIds.has(id)) errors.push(`Evidence "${item.id}" refers to missing suspect "${id}".`);
    for (const id of item.relatedEventIds) if (!eventIds.has(id)) errors.push(`Evidence "${item.id}" refers to missing timeline event "${id}".`);
  }

  for (const event of mystery.timeline) {
    for (const id of event.relatedSuspectIds) if (!suspectIds.has(id)) errors.push(`Timeline event "${event.id}" refers to missing suspect "${id}".`);
    for (const id of event.relatedEvidenceIds) if (!evidenceIds.has(id)) errors.push(`Timeline event "${event.id}" refers to missing evidence "${id}".`);
  }

  for (const entry of mystery.solution.evidenceChain) {
    if (!evidenceIds.has(entry.evidenceId)) errors.push(`The solution refers to missing evidence "${entry.evidenceId}".`);
  }
  if (new Set(mystery.solution.evidenceChain.map(({ evidenceId }) => evidenceId)).size !== mystery.solution.evidenceChain.length) {
    errors.push('The solution evidence chain must use unique evidence items.');
  }
  if (!mystery.solution.evidenceChain.some(({ strength }) => strength === 'decisive')) {
    errors.push('The solution needs at least one decisive evidence link.');
  }

  const expectedClearances = [...suspectIds].filter((id) => id !== mystery.solution.culpritId).sort();
  const actualClearances = mystery.solution.suspectClearance.map(({ suspectId }) => suspectId).sort();
  if (new Set(actualClearances).size !== actualClearances.length || JSON.stringify(expectedClearances) !== JSON.stringify(actualClearances)) {
    errors.push('The solution must clear each non-culprit exactly once.');
  }

  const timelineTimes = mystery.timeline.map((event) => event.timestamp ? Date.parse(event.timestamp) : null);
  const orderedTimes = timelineTimes.filter(Number.isFinite);
  if (orderedTimes.some((time, index) => index > 0 && time < orderedTimes[index - 1])) {
    errors.push('Timeline events with exact timestamps must be in chronological order.');
  }

  if (request.evidenceTypes.length > 1 && new Set(mystery.evidence.map(({ type }) => type)).size < 2) {
    errors.push('Use a mix of at least two requested evidence types.');
  }

  return errors;
}

export function formatValidationIssues(issues) {
  return issues.slice(0, 30).map((issue) => {
    const path = issue.path.length ? issue.path.join('.') : 'case';
    return `${path}: ${issue.message}`;
  });
}
