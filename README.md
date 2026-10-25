# AI Mystery Room

AI Mystery Room is a fictional investigation game project. This repository is at **Milestone 1**: it contains a React page shell, route placeholders, an Express health endpoint, shared visual tokens, and environment configuration. Case creation, persistence, Gemini generation, and gameplay are not implemented yet; the interface does not claim to generate cases.

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

The landing, create, case brief, investigation, result, and history routes render shell placeholders so routing can be checked. Only the landing page is a designed page at this milestone. No MongoDB connection or Gemini calls are made, so credentials for those features are not needed to run this shell.

## Environment variables

`.env.example` lists the planned server configuration using placeholders only. The Milestone 1 server validates `NODE_ENV`, `PORT`, and `CLIENT_ORIGIN`; MongoDB, Gemini, session, and rate-limit settings are reserved for later milestones and are not consumed yet. Never put secrets in client/Vite variables or commit `.env`.

## Scripts

- `npm run dev` — run Express and Vite together.
- `npm run dev:server` — run only Express.
- `npm run dev:client` — run only Vite.
- `npm run build` — build the client.
- `npm start` — start the Express server.

## Milestones

Implementation follows §16 of [SPEC.md](./SPEC.md):

1. **Repository and shell (current):** inspect the repository; add client/server scripts, environment validation, responsive shell, routing, design tokens, health endpoint, and setup docs.
2. **Mock playable case:** add a fixed fictional case and full play flow with public/private data separation.
3. **MongoDB and sessions:** persist cases/sessions, hash session tokens, support resume and one accusation.
4. **Gemini generation:** add server-side structured generation, validation, repair/retries, and safe failures.
5. **Hardening:** add rate limits, headers, CORS, request limits, error handling, logging, and privacy/authorization tests.
6. **Polish:** improve mobile/accessibility/loading/error states and optional filters/history.
7. **Deployment readiness:** document production configuration and verify build, lint, tests, and health check.

Later milestones are not implemented in this scaffold.
