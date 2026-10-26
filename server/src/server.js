import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { ensureDemoCaseSeeded } from './services/case-seed.service.js';

async function startServer() {
  await connectDatabase(env.mongodbUri);
  await ensureDemoCaseSeeded();

  app.listen(env.port, () => {
    console.log(`AI Mystery Room API listening on port ${env.port} (${env.nodeEnv}).`);
  });
}

startServer().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
