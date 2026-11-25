import { Router } from 'express';
import type { ApiHealthResponse } from '@bazaar/types';

export interface HealthChecker {
  checkAll(): Promise<ApiHealthResponse>;
}

export function createHealthRouter(health: HealthChecker): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const result = await health.checkAll();
    res.status(result.status === 'ok' ? 200 : 503).json(result);
  });

  return router;
}
