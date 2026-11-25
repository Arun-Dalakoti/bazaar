import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import type { ApiHealthResponse } from '@bazaar/types';
import type { AppEnv } from '../config/env.js';
import type { HealthChecker } from './health.router.js';

type DependencyStatus = 'up' | 'down';

type DependencyCheck = {
  status: DependencyStatus;
};

type StoreUrls = Pick<
  AppEnv,
  'DATABASE_URL' | 'MONGODB_URI' | 'REDIS_URL' | 'MEILISEARCH_URL'
>;

export class StoreHealthService implements HealthChecker {
  private readonly postgres: Pool;
  private readonly mongo: MongoClient;
  private readonly redis: Redis;
  private readonly meilisearchUrl: string;

  constructor(env: StoreUrls) {
    this.postgres = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 2500,
      statement_timeout: 2500,
    });

    this.mongo = new MongoClient(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });

    this.redis = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 2500,
      commandTimeout: 2500,
      maxRetriesPerRequest: 1,
    });

    // Without a listener ioredis logs every failed reconnect as an unhandled error.
    // The health check already reports Redis as down, so the event can be ignored here.
    this.redis.on('error', () => {});

    this.meilisearchUrl = env.MEILISEARCH_URL.replace(/\/+$/, '');
  }

  async checkAll(): Promise<ApiHealthResponse> {
    const [postgres, mongo, redis, meilisearch] = await Promise.all([
      this.check(() => this.checkPostgres()),
      this.check(() => this.checkMongo()),
      this.check(() => this.checkRedis()),
      this.check(() => this.checkMeilisearch()),
    ]);

    const checks = { postgres, mongo, redis, meilisearch };
    const allUp = Object.values(checks).every((check) => check.status === 'up');

    return {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  /** Close every store client. Call once on shutdown. */
  async close() {
    await Promise.allSettled([this.postgres.end(), this.mongo.close()]);

    this.redis.disconnect();
  }

  private async check(ping: () => Promise<void>): Promise<DependencyCheck> {
    try {
      await ping();
      return { status: 'up' };
    } catch {
      // Keep connection details and credentials out of the public health response.
      return { status: 'down' };
    }
  }

  private async checkPostgres(): Promise<void> {
    await this.postgres.query('SELECT 1');
  }

  private async checkMongo(): Promise<void> {
    await this.mongo.db().command({ ping: 1 });
  }

  private async checkRedis(): Promise<void> {
    const result = await this.redis.ping();

    if (result !== 'PONG') {
      throw new Error('Redis did not return PONG');
    }
  }

  private async checkMeilisearch(): Promise<void> {
    const response = await fetch(`${this.meilisearchUrl}/health`, {
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      throw new Error(`Meilisearch returned HTTP ${response.status}`);
    }
  }
}
