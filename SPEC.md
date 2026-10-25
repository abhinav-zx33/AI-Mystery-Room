# AI Mystery Room — Product & Engineering Specification
**Document type:** Single Source of Truth (SSOT) for Codex  
**Version:** 1.0  
**Status:** Initial implementation specification  
**Project name:** AI Mystery Room  
**Frontend:** React  
**Backend:** Node.js + Express  
**Database:** MongoDB  
**AI provider:** Google Gemini  
**Primary purpose:** Generate fictional, interactive investigation mysteries from a user-provided premise.

---

## 0. Instructions to Codex

This document is the canonical specification. Read it before implementing any feature.

1. Treat this document as the source of truth. Do not silently invent conflicting product behavior, routes, schemas, or visual conventions.
2. Before editing, inspect the existing repository. Preserve working code and established conventions unless they conflict with this specification.
3. If the repository is empty, scaffold the project using the structure in §15.
4. Implement in the milestones in §16. Keep the app runnable after each milestone.
5. Do not expose Gemini API keys or call Gemini directly from the browser. All model calls must happen on the server.
6. Treat all mysteries, suspects, evidence, messages, images, recordings, and identities as fictional and AI-generated or clearly labeled demo content.
7. Never let the client decide the canonical culprit or scoring outcome. The server owns the solution and validates submissions.
8. Validate all inputs on the server, handle model failures, and provide useful loading, empty, and error states.
9. Prefer typed, validated contracts and reusable components over duplicated logic. If TypeScript is used, use it consistently for client and server.
10. Do not claim that a real WhatsApp account, real CCTV feed, or real person was accessed. These are simulated artifacts inside the game.
11. If a requirement is ambiguous, choose the simplest safe implementation consistent with this document and document the decision. Do not block progress over minor styling choices.
12. Add tests for core game logic, API validation, solution privacy, and scoring.

### Definition of done
The project is complete when a user can enter a premise, generate a playable mystery, inspect all released evidence, submit one final culprit selection, receive a result and explanation, and revisit their saved cases—without the correct answer being leaked before submission.

---

## 1. Product Overview

### 1.1 Product statement
AI Mystery Room is a web application where a user supplies a short scenario, story seed, or mystery premise. The application uses Gemini to create a fictional investigation with suspects, a timeline, evidence artifacts, and one canonical culprit. The user examines the evidence and chooses who they believe committed the fictional crime or incident.

### 1.2 Problem and value
The product turns a user’s creative prompt into a structured detective game. It combines generative storytelling with evidence-based deduction, giving users an interactive mystery rather than a static story.

### 1.3 Core user journey
1. User opens the landing page.
2. User chooses **Create a Mystery**.
3. User enters a premise and selects optional settings (difficulty, tone, evidence types, estimated play time).
4. User submits the request.
5. The server validates it and asks Gemini to generate a complete mystery in a strict structured format.
6. The server validates coherence, required fields, suspect count, evidence references, timeline, and solution.
7. The app saves the case and shows a **Case Brief** without revealing the culprit.
8. User opens the investigation room and reviews suspect profiles and evidence.
9. User may filter/sort evidence and inspect artifact details.
10. User selects a suspect and confirms a final accusation.
11. The server checks the selection against the hidden canonical solution and records the result.
12. The user sees a result screen with the outcome, explanation, evidence chain, and optionally a replay/new case action.

### 1.4 Product principles
- **Fair play:** The evidence should support a logical solution.
- **One canonical answer:** Exactly one culprit is correct in the standard game mode.
- **No answer leakage:** The client never receives the hidden solution before the final accusation.
- **Fictional by default:** The app clearly labels generated artifacts as fictional simulations.
- **Progressive disclosure:** Show enough context to investigate without revealing the answer.
- **Resilience:** A model response can be malformed or unavailable; the app must recover gracefully.
- **Accessible and responsive:** Usable on desktop, tablet, and mobile.

### 1.5 Non-goals for v1
- Real police or forensic workflows.
- Real WhatsApp, camera, email, or social account integrations.
- Real-time video generation or live CCTV access.
- Multiplayer, public leaderboards, payments, subscriptions, or user-to-user messaging.
- User-uploaded real-person images or real surveillance footage.
- Training or fine-tuning a custom AI model.
- Guaranteed production-grade video generation. For v1, recordings may be represented by fictional transcript/timeline cards or generated stills; do not fabricate a playable video unless a supported generation provider is explicitly integrated.

---

## 2. Target Users and Use Cases

### Primary user
A casual player who enjoys detective stories, escape rooms, logic puzzles, and interactive fiction.

### Secondary users
- Creators who want to turn their own story seed into a mystery.
- Users who want short, replayable reasoning challenges.

### User stories
- As a user, I want to enter my own scenario so the mystery feels personal.
- As a user, I want to choose difficulty so the case suits my experience.
- As a user, I want to inspect evidence individually and compare it with other clues.
- As a user, I want evidence to be consistent so I can reason toward the answer.
- As a user, I want to accuse one suspect and understand whether my reasoning was correct.
- As a user, I want to see the explanation after submitting, including which clues matter.
- As a user, I want to return to a saved case without losing my progress.
- As a user, I want the site to clearly indicate that generated chats, photos, and recordings are fictional.

---

## 3. Scope and Priorities

### P0 — Required for first usable release
- Responsive landing page.
- Mystery creation form with premise and settings.
- Gemini-based structured mystery generation on the server.
- Schema validation and retry/fallback behavior.
- Case brief, suspect list, evidence room, artifact detail view.
- Final accusation and server-side result calculation.
- Post-accusation solution explanation.
- MongoDB persistence for cases and game sessions.
- Fictional-content labeling.
- Input validation, rate limiting, safe error handling, API-key protection.
- Core tests and setup documentation.

### P1 — Valuable improvements
- Difficulty presets and evidence filters.
- Timeline view.
- Evidence-board layout that lets users pin clues and add private notes.
- Hint system that reveals graduated nudges without revealing the culprit.
- Download/print case summary after resolution.
- Basic anonymous play with a locally stored session identifier, if safe and appropriate.

### P2 — Later possibilities
- Accounts and cloud-synced history.
- Multiple endings or non-crime mysteries.
- More than one correct solution in a special mode.
- Dedicated image generation provider and asset storage.
- Real video generation, if a suitable provider and budget are approved.
- Multiplayer and community-created cases.

Do not implement P1/P2 features ahead of P0 unless needed to support the architecture.

---

## 4. Functional Requirements

### FR-01: Landing page
The landing page must:
- Explain the game in a short headline and subheading.
- Provide a primary **Create a Mystery** action.
- Show a short “How it works” section: Create → Investigate → Accuse → Reveal.
- Include example case cards or sample prompts, clearly labeled as fictional.
- Include a visible notice that all evidence is AI-generated fiction.
- Be responsive and accessible.

### FR-02: Create a Mystery form
Required field:
- `premise`: 30–1,500 characters after trimming.

Optional fields:
- `difficulty`: `easy | medium | hard`; default `medium`.
- `tone`: `classic_detective | suspense | lighthearted | noir`; default `classic_detective`.
- `setting`: optional free text, maximum 120 characters.
- `evidenceTypes`: subset of `chat | image | cctv_transcript | document | witness_statement | timeline`; default all supported types.
- `playTimeMinutes`: `5 | 10 | 15 | 20`; default `10`.

Validation:
- Reject blank or too-short premise.
- Enforce maximum lengths and enum values on both client and server.
- Do not accept client-supplied culprit, solution, hidden reasoning, or evidence answer keys.
- Show character count and clear validation messages.
- Disable duplicate submission while a request is in progress.
- Warn the user not to enter private information about real people.

### FR-03: Mystery generation
The backend must:
- Create a unique case ID.
- Send a structured generation request to Gemini.
- Request JSON conforming to the schema in §8.
- Validate and normalize the model output.
- Check that there are 3–5 suspects, exactly one culprit, at least 5 evidence items, a timeline, and a solvable explanation.
- Check that all evidence references point to existing suspects and valid event IDs.
- Check that the canonical culprit exists in the suspect list.
- Check that the client-facing public case contains no solution key.
- Retry generation at most twice after an invalid model response, using a repair prompt that includes validation errors but not secrets.
- If generation still fails, return a safe error and allow the user to retry. Do not save a partially valid case as playable.
- Save the complete canonical case server-side, with solution data isolated from public response mapping.
- Return only the public case payload.

### FR-04: Case brief
Display:
- Case title.
- Short summary and incident type.
- Fictional setting and incident time.
- Difficulty, estimated play time, and number of suspects/evidence items.
- Case status.
- **Enter Investigation** action.

Do not display the culprit, culprit flag, final solution, hidden rationale, or answer key.

### FR-05: Suspect profiles
Each suspect profile must display:
- Name (fictional).
- Age range or age, only if relevant and non-sensitive.
- Role/relationship to the incident.
- Public profile description.
- Stated alibi.
- Motive or apparent motive, if known.
- Optional portrait asset or generated image, with fictional label and fallback placeholder.

Suspect list must not expose `isCulprit`, `culpritId`, private motive notes, or any hidden solution fields.

### FR-06: Evidence room
Supported artifact types:
- `chat`: fictional WhatsApp-style conversation transcript, clearly labeled **SIMULATED CHAT — NOT REAL MESSAGES**.
- `image`: AI-generated or placeholder image with a caption and metadata; if no image provider is configured, show a designed evidence card rather than a broken image.
- `cctv_transcript`: fictional CCTV observation/transcript with timestamp, camera label, and limitations. Label **SIMULATED CCTV RECORD — NOT REAL FOOTAGE**.
- `document`: fictional receipt, note, report, access log, or similar document.
- `witness_statement`: fictional witness statement.
- `timeline`: event/timestamp evidence.

Each evidence item must have:
- Unique ID.
- Title.
- Type.
- In-world timestamp or time range, where relevant.
- Description.
- Artifact content.
- Source/collection context.
- Related suspect IDs, if any.
- Related event IDs, if any.
- Reliability label: `high | medium | low`.
- A short reason for reliability level.
- Optional media URL or asset reference.
- A clear fictional/simulated label.

Users can:
- Browse all evidence.
- Filter by type and suspect.
- Sort by time or evidence title.
- Open an evidence detail modal/page.
- Return to the investigation without losing the current selection.

Do not include private fields like `solutionRelevance`, `culpritProof`, `hiddenContradiction`, or `answerExplanation` in the public API before accusation.

### FR-07: Timeline
Display key events in chronological order. Each event should have:
- Event ID.
- Timestamp or approximate time.
- Description.
- Optional related suspects and evidence IDs.
- Explicit uncertainty where the evidence does not establish an exact time.

The timeline should not claim certainty beyond the evidence. It is a player-facing reconstruction, not the hidden answer.

### FR-08: Final accusation
- User selects exactly one suspect.
- Show a confirmation step: “Submit your final accusation? You may not change it after submission.”
- On confirmation, send only the selected suspect ID and session ID to the server.
- Server checks that the case exists, is playable, and has not already been resolved for that session.
- Server calculates correctness from the canonical solution.
- Server records the accusation and result.
- Do not trust a client-supplied `isCorrect`, score, culprit ID, or solution.
- Default v1 rule: one final accusation per session. If a session has already submitted, return the existing result rather than scoring again.
- Make the one-attempt rule visible before confirmation.

### FR-09: Result and reveal
After the accusation, show:
- Correct/incorrect outcome.
- Actual culprit.
- Final case explanation.
- Evidence chain: which public clues support the conclusion.
- Timeline reconstruction.
- Why the other suspects were less likely / what clears them, where supported.
- A replay/new case action.

Only now may the server return canonical culprit and solution details. The result should explain the reasoning in a clear narrative, not expose internal model chain-of-thought. Use a concise, user-facing rationale based on explicit clue-to-conclusion links.

### FR-10: Hints (P1)
If implemented:
- Provide up to three graduated hints.
- Hint 1 points to a broad evidence category.
- Hint 2 points to a contradiction or time window.
- Hint 3 narrows the relevant evidence without naming the culprit.
- Store hint usage and optionally adjust a score, but do not change whether the final accusation is correct.
- Hints must be generated during case creation or validated against the hidden solution. Avoid calling Gemini for arbitrary live hints that could leak the answer.

### FR-11: History and resume
- Save case and session state in MongoDB.
- Allow the same browser/session to reopen an in-progress case using a session identifier.
- Store viewed evidence IDs if practical.
- If accounts are not implemented, do not imply that cases are synced across devices.
- Avoid placing the canonical solution in browser storage or URLs.

### FR-12: Loading and errors
- Show progress stages such as “Building the case”, “Preparing evidence”, and “Checking consistency” without pretending to report exact model internals.
- Provide timeout handling and retry.
- Display friendly errors for validation, rate limits, provider failures, and missing cases.
- Never display stack traces, API keys, raw provider responses, or internal prompts to users.

---

## 5. UX and Visual Design

### 5.1 Art direction
A cinematic detective workspace: dark charcoal/navy background, muted surfaces, warm amber evidence highlights, restrained red for warnings, high-contrast typography, subtle grain or paper textures, and clear information hierarchy. Avoid cluttered “hacker dashboard” clichés.

Suggested design tokens (adjust only if the existing project has a coherent system):
- `--color-bg`: `#0B1020`
- `--color-surface`: `#121A2B`
- `--color-surface-raised`: `#1B263A`
- `--color-text`: `#F4F6FA`
- `--color-text-muted`: `#A7B1C2`
- `--color-accent`: `#F4B544`
- `--color-danger`: `#E45B64`
- `--color-success`: `#59C49A`
- `--color-border`: `#2A3549`
- Use readable font sizes, visible focus states, and consistent spacing.

### 5.2 Main routes/pages
1. `/` — Landing page.
2. `/create` — Create a mystery form.
3. `/cases/:caseId` — Case brief.
4. `/cases/:caseId/investigate` — Investigation room.
5. `/cases/:caseId/result` — Resolved result; server must verify that the session has submitted.
6. Optional `/history` — Cases available to the current browser/session.

### 5.3 Investigation room layout
Desktop:
- Header: case title, status, progress indicator, exit/back action.
- Left rail: suspect cards and filters.
- Main panel: evidence grid/list and evidence detail.
- Optional right panel: timeline or notebook.
- Bottom/sticky action: “Make Final Accusation”.

Mobile:
- Stack panels vertically.
- Use tabs or drawers for Suspects, Evidence, Timeline.
- Keep the accusation CTA accessible without covering evidence.
- Modals must fit small screens and be keyboard dismissible.

### 5.4 Interaction rules
- Buttons have hover, focus, disabled, and loading states.
- Cards have clear click/tap affordances.
- Confirm destructive/irreversible actions.
- Avoid animations that delay access to content.
- Respect reduced-motion preferences.
- Provide alt text for meaningful images; decorative textures use empty alt text.
- Keyboard users can navigate all interactive controls.

### 5.5 Empty states
- No evidence matches filters: “No evidence matches these filters. Clear filters to see all evidence.”
- History empty: explain how to create the first case.
- Missing media: show a designed placeholder and the artifact description.
- Case unavailable: offer return to home; do not leak whether a hidden case ID exists to unauthorized users.

---

## 6. Architecture

### 6.1 High-level architecture
- **React client:** UI, form validation for usability, navigation, evidence browsing, session ID handling.
- **Express API:** authoritative validation, case generation, persistence, session logic, accusation scoring, public/private response separation.
- **MongoDB:** cases, sessions, accusation records, optional asset metadata.
- **Gemini API:** structured fictional case generation and, optionally, schema repair.
- **Optional media provider:** separate future integration for image/video assets. The app must work without it.

### 6.2 Trust boundaries
- Browser input is untrusted.
- Gemini output is untrusted until validated.
- The server is the sole authority for canonical solutions and score.
- MongoDB documents must be mapped into explicit public DTOs; never serialize a full database document directly to the client.
- API keys and prompts stay server-side.
- Do not place secrets in Vite variables except public values; never use `VITE_*` for Gemini keys.

### 6.3 Suggested deployment
- Client: static hosting such as Vercel/Netlify.
- API: Node-capable hosting.
- Database: managed MongoDB.
- Secrets configured in hosting environment variables.
- Configure CORS to allow only the deployed client origin(s).
- Configure health check endpoint and structured logs.
- Keep provider usage/cost limits and request rate limits.

### 6.4 API conventions
- Prefix: `/api/v1`.
- JSON request and response bodies.
- Use HTTP status codes consistently.
- Standard error shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a longer scenario.",
    "requestId": "optional-correlation-id",
    "details": []
  }
}
```
Do not expose raw stack traces or provider error payloads.

---

## 7. API Contract

### `GET /api/v1/health`
Purpose: readiness/liveness check.
Response `200`:
```json
{ "status": "ok" }
```
Must not return secrets or detailed infrastructure information.

### `POST /api/v1/cases`
Purpose: generate and persist a new mystery.
Request:
```json
{
  "premise": "A rare manuscript disappears from a locked museum archive during a power cut.",
  "difficulty": "medium",
  "tone": "classic_detective",
  "setting": "A small museum during a private exhibition",
  "evidenceTypes": ["chat", "document", "cctv_transcript", "witness_statement", "timeline"],
  "playTimeMinutes": 10
}
```
Response `201` (public DTO only):
```json
{
  "case": {
    "id": "case_id",
    "title": "The Missing Manuscript",
    "summary": "A manuscript vanishes during a brief outage.",
    "incidentType": "theft",
    "setting": "A small museum during a private exhibition",
    "incidentTime": "2026-05-12T20:10:00Z",
    "difficulty": "medium",
    "playTimeMinutes": 10,
    "status": "investigating",
    "suspects": [],
    "evidence": [],
    "timeline": [],
    "createdAt": "ISO_DATE"
  },
  "session": {
    "id": "session_id",
    "caseId": "case_id",
    "status": "in_progress"
  }
}
```
The example arrays are illustrative; actual successful cases must include validated content. Do not include the solution object, culprit flag, answer rationale, or hidden scoring fields.

### `GET /api/v1/cases/:caseId`
Purpose: retrieve public case brief and public investigation data for the associated session.
- Return `200` if accessible.
- Return `404` for missing or inaccessible cases.
- Never include solution fields.
- If session authorization is required, enforce it consistently.

### `GET /api/v1/cases/:caseId/session`
Purpose: restore the current browser session for a case.
- Session ID must be validated and scoped to the case.
- Return only session-safe fields.
- Never reveal the canonical solution.

### `POST /api/v1/cases/:caseId/accusation`
Request:
```json
{
  "sessionId": "session_id",
  "suspectId": "suspect_id"
}
```
Response `200`:
```json
{
  "result": {
    "isCorrect": false,
    "submittedSuspectId": "suspect_id",
    "attemptsUsed": 1,
    "status": "resolved"
  }
}
```
Before submission, this endpoint must not be called by the client. The response may say whether the guess is correct, but should not reveal the culprit or full explanation until the result endpoint is requested.

Errors:
- `400` invalid suspect/session input.
- `404` case/session/suspect not found or inaccessible.
- `409` already resolved; return the stored result safely.
- `429` rate limited.

### `GET /api/v1/cases/:caseId/result?sessionId=...`
Purpose: retrieve solution after valid accusation.
- Require a resolved session belonging to the case.
- Return `403` or `409` if not resolved, according to the chosen API convention; document the choice consistently.
- Response may include actual culprit, explanation, evidence chain, and timeline reconstruction.

Example:
```json
{
  "result": {
    "isCorrect": true,
    "submittedSuspectId": "suspect_2",
    "culprit": {
      "id": "suspect_2",
      "name": "Mira Sen"
    },
    "explanation": "The access log places Mira in the archive shortly before the outage...",
    "evidenceChain": [
      {
        "evidenceId": "evidence_3",
        "title": "Archive Access Log",
        "supports": "Only one suspect's access window conflicts with their stated alibi."
      }
    ],
    "timelineReconstruction": []
  }
}
```

### Optional endpoints
- `GET /api/v1/history?sessionId=...` — return cases available to the current browser/session.
- `POST /api/v1/cases/:caseId/hints` — only if P1 hints are implemented.
- `DELETE /api/v1/cases/:caseId/session` — optional local-session reset; do not delete shared case data without authorization.

---

## 8. Data Model and Canonical JSON Schema

### 8.1 Design rule
Store a canonical case with both public data and private solution data, but isolate them in separate fields/collections and use explicit serializers. A preferred implementation is:
- `cases` collection: public case content and metadata.
- `caseSolutions` collection: culprit ID, hidden reasoning notes, answer explanation, and clue mappings.
- `gameSessions` collection: session state and accusation.
This separation reduces accidental answer leakage. Use a transaction if available, or a safe creation sequence with cleanup on partial failure.

### 8.2 Case document
```ts
type Difficulty = "easy" | "medium" | "hard";
type Tone = "classic_detective" | "suspense" | "lighthearted" | "noir";
type EvidenceType =
  | "chat"
  | "image"
  | "cctv_transcript"
  | "document"
  | "witness_statement"
  | "timeline";

interface CaseDocument {
  _id: ObjectId;
  title: string;
  premise: string;
  summary: string;
  incidentType: string;
  setting: string;
  incidentTime: string;
  difficulty: Difficulty;
  tone: Tone;
  playTimeMinutes: number;
  status: "ready" | "archived";
  suspects: SuspectPublic[];
  evidence: EvidencePublic[];
  timeline: TimelineEventPublic[];
  generation: {
    provider: "gemini";
    model: string;
    schemaVersion: "1.0";
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface SuspectPublic {
  id: string;
  name: string;
  role: string;
  profile: string;
  statedAlibi: string;
  apparentMotive: string;
  portraitAsset?: string;
}

interface EvidencePublic {
  id: string;
  title: string;
  type: EvidenceType;
  timestamp?: string;
  description: string;
  content: Record<string, unknown>;
  sourceContext: string;
  relatedSuspectIds: string[];
  relatedEventIds: string[];
  reliability: "high" | "medium" | "low";
  reliabilityReason: string;
  assetUrl?: string;
  fictionalLabel: string;
}

interface TimelineEventPublic {
  id: string;
  timestamp?: string;
  approximateTime?: string;
  description: string;
  relatedSuspectIds: string[];
  relatedEvidenceIds: string[];
  certainty: "confirmed" | "estimated" | "disputed";
}
```

### 8.3 Private solution document
```ts
interface CaseSolutionDocument {
  _id: ObjectId;
  caseId: ObjectId;
  culpritId: string;
  explanation: string;
  motive: string;
  opportunity: string;
  method: string;
  evidenceChain: Array<{
    evidenceId: string;
    deduction: string;
    strength: "decisive" | "supporting" | "context";
  }>;
  suspectClearance: Array<{
    suspectId: string;
    explanation: string;
  }>;
  internalConsistencyNotes: string[];
  createdAt: Date;
}
```
`internalConsistencyNotes` and hidden generation diagnostics must never be returned publicly.

### 8.4 Game session document
```ts
interface GameSessionDocument {
  _id: ObjectId;
  caseId: ObjectId;
  sessionTokenHash: string;
  status: "in_progress" | "resolved";
  viewedEvidenceIds: string[];
  hintsUsed: number;
  accusation?: {
    suspectId: string;
    isCorrect: boolean;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}
```
Use a cryptographically secure random session token. If the raw token is returned to the client, store only a hash server-side. Avoid treating a predictable database ID as an authorization secret.

### 8.5 Gemini generation output
The model should generate an internal structured object similar to:
```json
{
  "title": "The Missing Manuscript",
  "summary": "A manuscript disappears during a brief power interruption.",
  "incidentType": "theft",
  "setting": "A small museum during a private exhibition",
  "incidentTime": "2026-05-12T20:10:00Z",
  "suspects": [
    {
      "id": "suspect_1",
      "name": "Mira Sen",
      "role": "Archive conservator",
      "profile": "A careful conservator responsible for the archive.",
      "statedAlibi": "She says she was in the restoration room.",
      "apparentMotive": "She feared the archive would be closed."
    }
  ],
  "evidence": [
    {
      "id": "evidence_1",
      "title": "Archive Access Log",
      "type": "document",
      "timestamp": "2026-05-12T20:04:00Z",
      "description": "A printed access record from the archive door.",
      "content": {
        "format": "text",
        "text": "20:04 — Archive door opened using staff badge 14."
      },
      "sourceContext": "A staff member found the printed access report.",
      "relatedSuspectIds": ["suspect_1"],
      "relatedEventIds": ["event_2"],
      "reliability": "high",
      "reliabilityReason": "The access system records the badge and time, though a badge could be borrowed.",
      "fictionalLabel": "FICTIONAL EVIDENCE"
    }
  ],
  "timeline": [
    {
      "id": "event_1",
      "timestamp": "2026-05-12T19:50:00Z",
      "description": "Guests enter the private exhibition.",
      "relatedSuspectIds": [],
      "relatedEvidenceIds": [],
      "certainty": "confirmed"
    }
  ],
  "solution": {
    "culpritId": "suspect_1",
    "motive": "The culprit wanted to prevent the archive's closure.",
    "opportunity": "The access window placed the culprit near the archive.",
    "method": "The manuscript was moved during the outage using a service passage.",
    "explanation": "The access record and contradictory alibi establish the most likely sequence.",
    "evidenceChain": [
      {
        "evidenceId": "evidence_1",
        "deduction": "The badge log contradicts the stated alibi.",
        "strength": "decisive"
      }
    ],
    "suspectClearance": [
      {
        "suspectId": "suspect_2",
        "explanation": "A time-stamped receipt supports the suspect's location elsewhere."
      }
    ],
    "internalConsistencyNotes": [
      "Ensure all timestamps and alibis remain consistent."
    ]
  }
}
```
This is an illustrative shape, not a complete valid case: production validation must enforce 3–5 suspects and at least 5 evidence items, and must ensure every reference resolves.

### 8.6 Artifact-specific content
Use typed unions or validated schemas for each evidence type rather than allowing arbitrary unbounded content:
- `chat`: `{ participants: string[], messages: [{ timestamp?: string, sender: string, text: string }] }`
- `image`: `{ altText: string, caption: string, visibleDetails: string[], generationStatus: "generated" | "placeholder" }`
- `cctv_transcript`: `{ cameraLabel: string, intervalStart?: string, intervalEnd?: string, transcript: [{ timestamp?: string, observation: string }], limitations: string[] }`
- `document`: `{ documentType: string, text: string, fields?: { label: string, value: string }[] }`
- `witness_statement`: `{ witnessName: string, statement: string, confidence: "high" | "medium" | "low" }`
- `timeline`: `{ events: [{ timestamp?: string, description: string }] }`

Do not put hidden solution data inside these public artifact content objects.

---

## 9. AI Generation and Mystery Quality

### 9.1 Provider integration
- Use the official Google Gen AI SDK supported by the current Node environment.
- Pin or constrain the SDK version in package metadata.
- Read `GEMINI_API_KEY` and the configured model name from server environment variables.
- Default model environment variable: `GEMINI_MODEL`; do not hard-code a model name throughout the codebase.
- Use structured output/JSON mode or schema-constrained generation if supported by the chosen model/SDK.
- Keep prompts in server-side files for review and testing.
- Set request timeouts, token/output limits, and retry limits.
- Log provider request IDs and high-level status, not secrets or unnecessarily sensitive prompt contents.

### 9.2 Required generation prompt principles
The system prompt should instruct Gemini to:
- Generate a fully fictional mystery based on the premise.
- Use 3–5 suspects and exactly one canonical culprit.
- Create at least 5 evidence items, with a mix of selected evidence types.
- Make the mystery solvable from evidence available to the player.
- Give every suspect a plausible profile, alibi, and possible motive; avoid making the culprit obvious by writing style alone.
- Use consistent timestamps, geography, names, roles, and events.
- Include at least two clues that support the correct solution and at least one meaningful contradiction or elimination clue.
- Include plausible red herrings that do not make another suspect equally correct.
- Ensure the culprit has motive, opportunity, and a plausible method.
- Ensure the explanation explicitly maps evidence to deductions.
- Avoid graphic detail, sexual violence, real-world accusations, real private data, and instructions for committing crimes.
- Avoid using actual private people or presenting generated artifacts as authentic records.
- Return only the required JSON object, with no markdown fences or commentary.

### 9.3 Solvability rules
A case is invalid if:
- The culprit does not exist in the suspect list.
- A required evidence ID or suspect ID reference is missing.
- The final explanation depends on information not present in public evidence or an explicitly disclosed post-game reveal.
- The timestamps make the canonical solution impossible.
- A non-culprit has equally strong evidence for the same motive, opportunity, and method with no differentiating clue.
- A key clue is only stated in the hidden solution and never shown to the player.
- A supposed contradiction is not actually contradictory.
- The correct answer can only be guessed by a name, portrait, stereotype, or arbitrary narrative emphasis.

### 9.4 Validation pipeline
1. Parse JSON.
2. Validate the top-level schema.
3. Validate enum values and string/array bounds.
4. Verify suspect count and unique IDs.
5. Verify minimum evidence count and unique IDs.
6. Verify exactly one culprit ID that matches a suspect.
7. Verify all evidence, event, and suspect references.
8. Verify timestamps parse and are ordered where applicable.
9. Verify evidence-type requests are respected where possible.
10. Verify explanation and evidence chain are non-empty and refer to valid public clues.
11. Run a deterministic rule-based consistency pass.
12. If validation fails, retry/repair no more than twice.
13. If still invalid, return a retryable error; do not expose invalid partial data.

Do not rely solely on a second LLM call to validate truth. Use deterministic checks for structure and references. Semantic validation may supplement, not replace, deterministic validation.

### 9.5 Image and CCTV behavior
Gemini text output does not automatically mean an actual image or video file exists.
- If a supported image generation provider is configured, generate images server-side and store the resulting asset URL/metadata.
- If no image provider is configured, render a polished evidence card with description and a placeholder illustration; do not display a broken image URL.
- CCTV can be a timestamped transcript, frame description, or storyboard in v1. Label it accurately.
- Do not say “AI-generated image attached” unless an actual asset was generated and stored.
- Any generated image must be treated as fictional and must not imitate a real person without a valid, safe basis.

### 9.6 Model failure behavior
Handle:
- Invalid JSON.
- Schema mismatch.
- Safety refusal.
- Rate limits and quota exhaustion.
- Network timeouts.
- Provider outage.
- Empty or truncated responses.
Use bounded retries with exponential backoff only for retryable transient errors. Do not retry indefinitely or repeatedly charge for the same failure.

---

## 10. Security, Privacy, and Safety

- Keep all secrets in server environment variables.
- Add request body size limits.
- Validate and sanitize all user-provided strings; render user content as text, not raw HTML.
- Use a server-side schema validator such as Zod, Joi, or an equivalent.
- Add rate limiting to case generation and accusation endpoints.
- Add Helmet or equivalent security headers.
- Configure CORS allowlist for known frontend origins.
- Avoid logging full user premises by default; use request IDs and error categories.
- Do not collect real names, phone numbers, private messages, or real surveillance recordings for the game.
- Warn users to fictionalize real-world scenarios and not submit sensitive personal data.
- Treat all generated chats and records as fictional; add persistent labels on artifacts and the result page.
- Never use real brand logos in a way that implies official integration. A generic chat-like layout is preferred.
- Use secure random session tokens; store only a hash on the server.
- Protect result endpoints so the solution is unavailable before a valid accusation.
- Do not rely on hiding a button or a frontend route as security; enforce state on the backend.
- Avoid arbitrary URL fetching from model output. Asset URLs must be from an allowlisted provider/storage domain to prevent SSRF and unsafe content.
- If user accounts are added later, implement proper authentication, authorization, session expiry, and deletion controls.
- Provide a basic privacy notice explaining that the premise may be sent to Google Gemini for generation. Do not promise zero retention unless verified against current provider settings and terms.

### Abuse handling
If a premise requests a real accusation about a private individual, real private communications, or targeted harassment, transform the request into a clearly fictional scenario with fictional names, or reject it with a safe explanation. Do not generate fake “proof” intended to be passed off as real.

---

## 11. Error Codes

Use stable machine-readable codes:
- `VALIDATION_ERROR`
- `CASE_GENERATION_FAILED`
- `CASE_NOT_FOUND`
- `SESSION_NOT_FOUND`
- `INVALID_SUSPECT`
- `ALREADY_RESOLVED`
- `RESULT_NOT_AVAILABLE`
- `RATE_LIMITED`
- `AI_PROVIDER_UNAVAILABLE`
- `INTERNAL_ERROR`

Client messages should be friendly. Technical detail belongs in server logs with a request ID.

---

## 12. State and Game Rules

### Case status
- `ready`: case generation succeeded and case is playable.
- `archived`: not currently playable.

### Session status
- `in_progress`: no final accusation submitted.
- `resolved`: final accusation submitted and result recorded.

### Core rules
- One final accusation per session.
- One canonical culprit per case.
- Evidence viewing does not affect correctness.
- Hints, if implemented, do not change the canonical solution.
- Result access requires a resolved session.
- Refreshing or reopening an active session must not reset the attempt count.
- Repeated accusation requests must be idempotent: return the stored result or a conflict response; never create a second attempt.
- Case solution must remain server-only until resolution.

### Scoring for v1
Keep scoring simple:
- Correct accusation: `100` base points.
- Incorrect accusation: `0` base points.
- If hints are implemented, show a separate hint-adjusted score; do not alter the correctness result.
- Do not build a leaderboard in v1.

---

## 13. Accessibility and Quality Requirements

- Target WCAG 2.2 AA practices where practical.
- Semantic HTML and meaningful heading order.
- Keyboard operation for navigation, forms, tabs, modals, evidence cards, and accusation flow.
- Visible focus ring.
- Sufficient text/background contrast.
- Alt text for evidence imagery.
- Form fields have labels and understandable error messages.
- Use `aria-live` for generation status and important async feedback.
- Respect `prefers-reduced-motion`.
- Responsive layouts for widths around 360px mobile through desktop.
- Avoid color as the only indicator of evidence reliability or correctness.

### Performance and reliability
- Keep normal non-generation API reads responsive.
- Show progress UI while AI generation is running.
- Add request timeout and bounded retry behavior.
- Lazy-load optional images.
- Paginate history if it grows.
- Avoid sending hidden solution data in initial case payloads.
- Do not set hard performance guarantees that depend on external Gemini latency; instrument the actual timings.

---

## 14. Environment Configuration

Create `.env.example` with placeholders only:
```dotenv
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_mystery_room
GEMINI_API_KEY=
GEMINI_MODEL=
CLIENT_ORIGIN=http://localhost:5173
SESSION_TOKEN_SECRET=
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
```

Rules:
- `.env` must be in `.gitignore`.
- Never commit real keys.
- `SESSION_TOKEN_SECRET` must be a long random secret in deployed environments.
- Validate required environment variables at server startup and fail with a clear developer-facing message if missing.
- If Gemini is not configured, show a controlled setup error in development and never pretend generation succeeded.
- A deterministic mock generator may be used for tests and local UI development, but it must be explicitly enabled and clearly identified as demo mode.

---

## 15. Suggested Repository Structure

A monorepo is recommended:
```text
ai-mystery-room/
  README.md
  SPEC.md
  .gitignore
  .env.example
  package.json
  client/
    package.json
    index.html
    src/
      app/
        App.tsx
        router.tsx
      components/
        layout/
        ui/
        suspect/
        evidence/
        timeline/
      pages/
        LandingPage.tsx
        CreateCasePage.tsx
        CaseBriefPage.tsx
        InvestigationPage.tsx
        ResultPage.tsx
        HistoryPage.tsx
      features/
        cases/
        sessions/
        accusation/
      lib/
        api.ts
        validators.ts
        session.ts
      styles/
        tokens.css
        global.css
  server/
    package.json
    src/
      app.ts
      server.ts
      config/
        env.ts
        database.ts
      routes/
        health.routes.ts
        cases.routes.ts
        sessions.routes.ts
      controllers/
      services/
        gemini.service.ts
        case-generation.service.ts
        case-validation.service.ts
        accusation.service.ts
      repositories/
      models/
        Case.ts
        CaseSolution.ts
        GameSession.ts
      schemas/
        case.schema.ts
        api.schema.ts
      prompts/
        generate-case.prompt.ts
        repair-case.prompt.ts
      serializers/
        public-case.serializer.ts
        result.serializer.ts
      middleware/
        error-handler.ts
        rate-limit.ts
        request-id.ts
      utils/
  tests/
    unit/
    integration/
```
If the existing repository uses JavaScript rather than TypeScript, keep it consistently in JavaScript unless there is a strong reason to migrate. The structure is guidance; equivalent organization is acceptable if the same separation of concerns is preserved.

---

## 16. Implementation Milestones

### Milestone 1 — Repository and shell
- Inspect repo and document current state.
- Set up client/server scripts and environment validation.
- Create responsive page shell, routing, shared design tokens, and health endpoint.
- Add README setup instructions.
**Acceptance:** app starts locally and all primary routes render.

### Milestone 2 — Mock playable case
- Create a fixed, fully fictional sample case in test/demo mode.
- Build case brief, suspect cards, evidence room, timeline, accusation confirmation, and result screen.
- Implement public/private DTO separation even in mock mode.
**Acceptance:** complete game flow works without Gemini, and the culprit is not exposed before accusation.

### Milestone 3 — MongoDB persistence and sessions
- Implement case, solution, and session persistence.
- Add secure session token generation and hashing.
- Implement resume behavior and one-attempt rules.
**Acceptance:** refresh preserves session state; repeated submissions do not allow multiple guesses.

### Milestone 4 — Gemini generation
- Implement provider service and strict structured output.
- Add schema validation, deterministic reference checks, bounded repair/retry, and failure handling.
- Add server-side prompt files.
**Acceptance:** valid premise creates a valid playable case; invalid model output never becomes a playable case.

### Milestone 5 — Hardening
- Add rate limits, security headers, CORS, body limits, error handling, logging, and API validation.
- Add tests for answer leakage and authorization.
**Acceptance:** hidden solution is not present in public payloads or browser network responses before accusation.

### Milestone 6 — Polish
- Responsive/mobile polish, accessibility, empty/error states, loading states, design refinements.
- Optional evidence filters and history.
**Acceptance:** core flows work on keyboard and mobile layouts.

### Milestone 7 — Deployment readiness
- Document deployment and environment variables.
- Configure production CORS and secrets.
- Verify build, lint, tests, and health endpoint.
**Acceptance:** clean deployment with no committed secrets and clear setup instructions.

---

## 17. Testing Strategy

### Unit tests
- Premise validation and enum validation.
- Gemini response schema validation.
- Duplicate/missing IDs detection.
- Reference integrity across suspects, evidence, and events.
- Culprit must match a known suspect.
- Public serializer removes all solution fields.
- Accusation correctness logic.
- One-accusation/idempotency rules.
- Session token hashing and comparison.

### Integration tests
- `POST /cases` validates input and returns only public fields.
- Model failure returns safe error and does not create a playable case.
- Case retrieval never leaks solution.
- Accusation resolves session exactly once.
- Result endpoint refuses access before resolution.
- Result endpoint returns the canonical explanation after resolution.
- Invalid session cannot read another session’s result.
- Rate limiting returns the expected status and error shape.

### End-to-end test
1. Open landing page.
2. Create a mystery using a valid premise.
3. Wait for generation success.
4. Open the case.
5. Inspect suspect and evidence details.
6. Verify no culprit ID/flag/solution exists in client responses.
7. Submit an accusation.
8. Open result and verify explanation appears only after submission.
9. Refresh the result page and verify it remains available for the same authorized session.

### Manual QA
- Mobile viewport.
- Keyboard-only navigation.
- Gemini unavailable / quota exhausted.
- Malformed model response.
- Missing image assets.
- Empty filter results.
- Double-clicking submit.
- Refresh during generation and after accusation.

---

## 18. Acceptance Criteria Checklist

A release is acceptable only if all P0 items are true:

- [ ] User can create a case from a premise and optional settings.
- [ ] Server validates all request fields.
- [ ] Gemini is called only from the backend.
- [ ] Model output is schema-validated before persistence.
- [ ] Case has 3–5 suspects, exactly one canonical culprit, and at least 5 evidence items.
- [ ] Evidence references are valid and the case has a coherent timeline.
- [ ] The UI displays evidence as fictional simulations.
- [ ] User can browse and filter evidence.
- [ ] User can submit one final accusation.
- [ ] Server computes correctness and enforces one attempt per session.
- [ ] Hidden solution is absent from all pre-accusation API responses.
- [ ] Result explanation is available only after a valid accusation.
- [ ] Refresh does not bypass the one-attempt rule.
- [ ] Missing/invalid Gemini responses do not create playable cases.
- [ ] Errors are friendly and do not leak secrets.
- [ ] Mobile and keyboard navigation are usable.
- [ ] `.env` is ignored by Git and `.env.example` contains placeholders only.
- [ ] Unit/integration tests cover solution privacy and scoring.
- [ ] README documents setup, scripts, environment variables, and troubleshooting.

---

## 19. Decisions and Constraints

- **Stack:** MERN (MongoDB, Express, React, Node.js).
- **AI:** Google Gemini through a server-side SDK.
- **Case generation:** One canonical culprit; generated structured JSON.
- **Evidence media:** v1 must function without a separate image/video generation provider. Use real generated assets only when a configured provider successfully creates them.
- **Authentication:** No mandatory account system for v1; use secure per-session tokens and clearly document browser/session limitations.
- **Game mode:** Single-player, one final accusation.
- **Persistence:** MongoDB.
- **Styling:** Responsive cinematic detective-room aesthetic; use the existing UI framework if already established.
- **No fake claims:** Do not imply access to real chats, CCTV, camera feeds, or private records.

If an implementation decision changes any of these, update this specification explicitly before implementing the change.

---

