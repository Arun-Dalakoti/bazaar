import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { StoreHealthService } from './store-health.service.js';
import type { ApiHealthResponse } from '@bazaar/types';

@Controller('health')
export class HealthController {
  constructor(private readonly storeHealth: StoreHealthService) {}

  @Get()
  async getHealth(): Promise<ApiHealthResponse> {
    const health = await this.storeHealth.checkAll();

    if (health.status !== 'ok') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
