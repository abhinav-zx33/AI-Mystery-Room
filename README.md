# AI Mystery Room

AI Mystery Room is a fictional investigation game project. This repository is at **Milestone 3**: it contains one fixed, fictional, playable sample case, MongoDB persistence for its public case and private solution, and persistent game sessions. The server reveals the solution only after the player submits a final accusation.

## Current repository state

The repository began with `SPEC.md` only. The scaffold follows the specification's React + Node.js/Express choices and uses JavaScript consistently. There was no existing implementation to preserve.

## Requirements

- Node.js 20 or newer
- npm

## Setup

1. Install and start MongoDB locally, or create a MongoDB Atlas database and copy its connection URI.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your database URI. Generate a session secret in Git Bash or PowerShell:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Put the generated value in `SESSION_TOKEN_SECRET` in `.env`. Keep `.env` private; it is ignored by Git.

3. Install dependencies from the repository root:

   ```sh
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

4. Start the client and API:

   ```sh
   npm run dev
   ```

The client runs at <http://localhost:5173> and proxies `/api` requests to the Express server at <http://localhost:5000>. The health check is `GET /api/v1/health`, returning `{ "status": "ok" }`.

Open <http://localhost:5173> and choose **Play the Sample Case**. The flow includes a case brief, suspect profiles, evidence filters and details, a timeline, one final accusation, and the solution reveal. The fixed sample case and its solution are seeded into separate MongoDB collections. Game sessions and final accusations persist across browser refreshes and server restarts. Session tokens are random, kept in the current browser tab’s session storage, and stored on the server only as HMAC hashes.

The sample case is fixed; the app does not accept a premise or claim to generate a mystery. Gemini is not called in this milestone. If the server cannot connect to MongoDB or required environment values are missing, it prints a developer-facing setup error and does not start.

The demo session is held in the server process’s memory. It survives a browser refresh in the same tab, but is lost when the server restarts. It is not a cloud-saved case history. Do not use this temporary demo session as a production authorization system.

## Environment variables

`.env.example` lists server configuration using placeholders only. The server validates `NODE_ENV`, `PORT`, `CLIENT_ORIGIN`, `MONGODB_URI`, and `SESSION_TOKEN_SECRET` at startup. `GEMINI_API_KEY` and `GEMINI_MODEL` are reserved for the generation milestone. Never put secrets in client/Vite variables or commit `.env`.

## Scripts

- `npm run dev` — run Express and Vite together.
- `npm run dev:server` — run only Express.
- `npm run dev:client` — run only Vite.
- `npm run build` — build the client.
- `npm start` — start the Express server.

## Milestones

Implementation follows §16 of [SPEC.md](./SPEC.md):

1. **Repository and shell (complete):** client/server scripts, environment validation, responsive shell, routing, design tokens, health endpoint, and setup docs.
2. **Mock playable case (complete):** fixed fictional case and full play flow with public/private data separation.
3. **MongoDB and sessions (current):** persist the demo case, private solution, and game sessions; hash session tokens; support resume and one accusation.
4. **Gemini generation:** add server-side structured generation, validation, repair/retries, and safe failures.
5. **Hardening:** add rate limits, headers, CORS, request limits, error handling, logging, and privacy/authorization tests.
6. **Polish:** improve mobile/accessibility/loading/error states and optional filters/history.
7. **Deployment readiness:** document production configuration and verify build, lint, tests, and health check.

Milestones 4–7 are not implemented yet.
