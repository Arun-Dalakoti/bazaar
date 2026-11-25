import { randomUUID } from 'node:crypto';
import { pino, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { AppEnv } from '../config/env.js';

// Accept only short, printable request IDs from callers; otherwise generate one.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

export function createLogger(env: Pick<AppEnv, 'LOG_LEVEL' | 'NODE_ENV'>): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      censor: '[REDACTED]',
    },
    ...(env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, singleLine: true },
          },
        }
      : {}),
  });
}

export function createHttpLogger(logger: Logger) {
  return pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incomingId = req.headers['x-request-id'];
      const requestId =
        typeof incomingId === 'string' && REQUEST_ID_PATTERN.test(incomingId)
          ? incomingId
          : randomUUID();

      res.setHeader('x-request-id', requestId);
      return requestId;
    },
  });
}
