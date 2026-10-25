# AI Mystery Room

AI Mystery Room is a fictional investigation game project. This repository is at **Milestone 2**: it contains a React application shell and one fixed, fictional, playable sample case. The server owns the case solution and only reveals it after the player submits an accusation.

## Current repository state

The repository began with `SPEC.md` only. The scaffold follows the specification's React + Node.js/Express choices and uses JavaScript consistently. There was no existing implementation to preserve.

## Requirements

- Node.js 20 or newer
- npm

## Setup

1. Copy `.env.example` to `.env` and adjust local values if needed.
2. Install dependencies from the repository root:

   ```sh
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

3. Start the client and API shell:

   ```sh
   npm run dev
   ```

The client runs at <http://localhost:5173> and proxies `/api` requests to the Express server at <http://localhost:5000>. The health check is `GET /api/v1/health`, returning `{ "status": "ok" }`.

Open <http://localhost:5173> and choose **Play the Sample Case**. The current flow includes a case brief, suspect profiles, evidence filters and details, a timeline, one final accusation, and the solution reveal. The sample case is fixed; the app does not accept a premise or claim to generate a mystery. No MongoDB connection or Gemini calls are made, so those credentials are not needed.

The demo session is held in the server process’s memory. It survives a browser refresh in the same tab, but is lost when the server restarts. It is not a cloud-saved case history. Do not use this temporary demo session as a production authorization system.

## Environment variables

`.env.example` lists the planned server configuration using placeholders only. The server validates `NODE_ENV`, `PORT`, and `CLIENT_ORIGIN`; MongoDB, Gemini, and rate-limit settings are reserved for later milestones and are not consumed yet. Never put secrets in client/Vite variables or commit `.env`.

## Scripts

- `npm run dev` — run Express and Vite together.
- `npm run dev:server` — run only Express.
- `npm run dev:client` — run only Vite.
- `npm run build` — build the client.
- `npm start` — start the Express server.

## Milestones

Implementation follows §16 of [SPEC.md](./SPEC.md):

1. **Repository and shell (complete):** client/server scripts, environment validation, responsive shell, routing, design tokens, health endpoint, and setup docs.
2. **Mock playable case (current):** fixed fictional case and full play flow with public/private data separation.
3. **MongoDB and sessions:** persist cases/sessions, hash session tokens, support resume and one accusation.
4. **Gemini generation:** add server-side structured generation, validation, repair/retries, and safe failures.
5. **Hardening:** add rate limits, headers, CORS, request limits, error handling, logging, and privacy/authorization tests.
6. **Polish:** improve mobile/accessibility/loading/error states and optional filters/history.
7. **Deployment readiness:** document production configuration and verify build, lint, tests, and health check.

Milestones 3–7 are not implemented yet.
