import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.schema.js';
import { HealthController } from './health/health.controller.js';
import { StoreHealthService } from './health/store-health.service.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',

        genReqId: (request, response) => {
          const incomingId = request.headers['x-request-id'];

          // Accept only short, printable IDs; otherwise generate a fresh one.
          const requestId =
            typeof incomingId === 'string' &&
            /^[A-Za-z0-9._:-]{1,128}$/.test(incomingId)
              ? incomingId
              : crypto.randomUUID();

          response.setHeader('x-request-id', requestId);
          return requestId;
        },

        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },

        ...(process.env.NODE_ENV !== 'production'
          ? {
              transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              },
            }
          : {}),
      },
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, StoreHealthService],
})
export class AppModule {}
