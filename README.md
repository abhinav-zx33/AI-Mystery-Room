# TraceBit

TraceBit is a fictional investigation game. Milestones 1-3 are complete. The Milestone 4 generation flow is implemented; live generation requires a configured Gemini API key and has not yet been verified with that key.

Generated public case data and private solutions are stored separately in MongoDB. The server validates model output and references before marking a case ready. It returns only the public case before accusation. Image evidence is shown as a labeled placeholder because this project does not include an image-generation provider.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB Atlas or a local MongoDB server
- A Google Gemini API key to generate new cases

## Setup

1. From the repository root, create the local server environment file:

   ```powershell
   Copy-Item .env.example server/.env
   ```

   On Git Bash, use `cp .env.example server/.env` instead.

2. Edit `server/.env`:
   - Set `MONGODB_URI` to your MongoDB URI, with the database name `ai_mystery_room`.
   - Set `SESSION_TOKEN_SECRET` to a random secret. Generate one in PowerShell or Git Bash with:

     ```sh
     node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
     ```

   - Set `GEMINI_API_KEY` to a key created in Google AI Studio. `GEMINI_MODEL` defaults to `gemini-3.6-flash` and can be changed here.

   Keep `server/.env` private. It is ignored by Git. Gemini generation is unavailable until `GEMINI_API_KEY` is set; the existing sample case does not require that key.

3. Install dependencies from the repository root:

   ```sh
   npm install
   npm --prefix client install
   npm --prefix server install
   ```

4. Run the server and client in separate terminals. On Windows PowerShell, use `npm.cmd` if the `npm` command is blocked by the script execution policy.

   Server terminal:

   ```powershell
   cd server
   npm.cmd run dev
   ```

   Client terminal:

   ```powershell
   cd client
   npm.cmd run dev
   ```

5. Open the **Local** URL Vite prints (usually <http://localhost:5173>). If another client already occupies that port, Vite may select 5174 or another available port.

## Use the app

Choose **Create a Mystery**, enter a fictional premise, and submit it. The premise and settings are sent from the server to Google Gemini. A successful response is schema-validated, checked for unique IDs and valid references, then saved with its solution in a separate collection. A game session is created and scoped to that case.

To play the fixed demo without Gemini, open <http://localhost:5173/cases/demo-case-001> (use the port printed by Vite if it differs).

The **Music Off** control enables optional, locally synthesized detective-style background music, with a minor-key drone, subtle ticking pulse, and sparse motif. It is off by default and starts only after you click it; it does not use an external audio service or the Gemini API.

The API health endpoint is `GET /api/v1/health`, returning `{ "status": "ok" }`.

## Environment variables

`.env.example` is a safe template. The running server reads `server/.env`:

- `MONGODB_URI` and `SESSION_TOKEN_SECRET` are required to start the API.
- `GEMINI_API_KEY` is required only when creating a generated case.
- `GEMINI_MODEL` selects the configured Gemini model.
- `CLIENT_ORIGIN` is reserved for server origin configuration.
- `GEMINI_API_KEY` must never be placed in a client/Vite variable or committed.

If Gemini is not configured, `POST /api/v1/cases` returns a controlled setup error. Invalid model output is retried with bounded repair attempts and is never saved as a playable case.

## Scripts

- `npm run dev` - start both client and server where the root script works.
- `npm run dev:server` - run only Express.
- `npm run dev:client` - run only Vite.
- `npm run build` - build the client.
- `npm start` - start the Express server.

## Milestones

1. **Repository and shell** - complete.
2. **Mock playable case** - complete.
3. **MongoDB persistence and sessions** - complete.
4. **Gemini generation** - implemented; live generation requires `GEMINI_API_KEY` and still needs a live run-through.
5. **Hardening** - not implemented.
6. **Polish** - not implemented.
7. **Deployment readiness** - not implemented.

See `SPEC.md` for the full product and engineering requirements.
