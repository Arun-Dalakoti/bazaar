import { parseEnv } from './config/env.js';
import { createLogger } from './lib/logger.js';
import { StoreHealthService } from './health/store-health.service.js';
import { createApp } from './app.js';

const env = parseEnv();
const logger = createLogger(env);
const health = new StoreHealthService(env);
const app = createApp({ logger, health });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API listening');
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down');

  // Stop accepting new connections, then close the store clients.
  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    await health.close();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
