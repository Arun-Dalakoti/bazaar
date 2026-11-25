import request from 'supertest';
import { pino } from 'pino';
import type { ApiHealthResponse } from '@bazaar/types';
import { createApp } from '../src/app.js';
import type { HealthChecker } from '../src/health/health.router.js';

function fakeHealth(status: ApiHealthResponse['status']): HealthChecker {
  const state = status === 'ok' ? 'up' : 'down';
  return {
    checkAll: async () =>
      ({
        status,
        timestamp: new Date().toISOString(),
        checks: {
          postgres: { status: 'up' },
          mongo: { status: state },
          redis: { status: 'up' },
          meilisearch: { status: 'up' },
        },
      }) as ApiHealthResponse,
  };
}

const logger = pino({ level: 'silent' });

describe('GET /health', () => {
  it('returns 200 when every store is up', async () => {
    const app = createApp({ logger, health: fakeHealth('ok') });
    const res = await request(app).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 503 when a store is down', async () => {
    const app = createApp({ logger, health: fakeHealth('degraded') });
    const res = await request(app).get('/health').expect(503);
    expect(res.body.checks.mongo.status).toBe('down');
  });

  it('echoes a valid x-request-id and replaces an invalid one', async () => {
    const app = createApp({ logger, health: fakeHealth('ok') });
    const ok = await request(app).get('/health').set('x-request-id', 'abc-123');
    expect(ok.headers['x-request-id']).toBe('abc-123');
    const bad = await request(app).get('/health').set('x-request-id', 'bad id!');
    expect(bad.headers['x-request-id']).not.toBe('bad id!');
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const app = createApp({ logger, health: fakeHealth('ok') });
    const res = await request(app).get('/nope').expect(404);
    expect(res.body).toEqual({ status: 404, message: 'Not found' });
  });
});
