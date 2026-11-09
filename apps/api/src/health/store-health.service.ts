import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import type { ApiHealthResponse } from '@bazaar/types';

type DependencyStatus = 'up' | 'down';

type DependencyCheck = {
  status: DependencyStatus;
};

@Injectable()
export class StoreHealthService implements OnModuleDestroy {
  private readonly postgres: Pool;
  private readonly mongo: MongoClient;
  private readonly redis: Redis;
  private readonly meilisearchUrl: string;

  constructor(config: ConfigService) {
    this.postgres = new Pool({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      connectionTimeoutMillis: 2500,
      statement_timeout: 2500,
    });

    this.mongo = new MongoClient(config.getOrThrow<string>('MONGODB_URI'), {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });

    this.redis = new Redis(config.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: true,
      connectTimeout: 2500,
      commandTimeout: 2500,
      maxRetriesPerRequest: 1,
    });

    this.meilisearchUrl = config
      .getOrThrow<string>('MEILISEARCH_URL')
      .replace(/\/+$/, '');
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

  async onModuleDestroy() {
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
