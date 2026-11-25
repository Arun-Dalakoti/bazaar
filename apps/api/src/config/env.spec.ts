import { parseEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/bazaar',
  MONGODB_URI: 'mongodb://localhost:27017/bazaar',
  REDIS_URL: 'redis://localhost:6379',
  MEILISEARCH_URL: 'http://localhost:7700',
};

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv(valid);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
  });

  it('throws a readable error for missing values', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });
});
