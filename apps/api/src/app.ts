import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { createHttpLogger } from './lib/logger.js';
import { createHealthRouter, type HealthChecker } from './health/health.router.js';
import { errorHandler, notFound } from './middleware/error-handler.js';

export interface AppDeps {
  logger: Logger;
  health: HealthChecker;
}

export function createApp({ logger, health }: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(createHttpLogger(logger));
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  app.use('/health', createHealthRouter(health));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
