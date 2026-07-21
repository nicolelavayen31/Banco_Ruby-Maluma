import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator {
    private readonly indicatorKey = 'redis:health:ping';
    private readonly indicatorVal = 'ok';
    private readonly indicatorTtl = 5_000;

    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    public async isHealthy() {
        const indicator = this.healthIndicatorService.check(this.indicatorKey);

        try {
            await this.cacheManager.set<string>(
                this.indicatorKey,
                this.indicatorVal,
                this.indicatorTtl,
            );
            const result = await this.cacheManager.get('health:ping');

            if (result !== this.indicatorVal) {
                throw new Error('Redis health check failed');
            }

            return indicator.up();
        } catch (error) {
            return indicator.down({
                message: (error as Error).message || 'Redis unreachable',
            });
        }
    }
}
