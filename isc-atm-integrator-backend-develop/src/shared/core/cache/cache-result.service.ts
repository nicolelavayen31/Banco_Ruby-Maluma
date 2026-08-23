import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Result } from '@shared/core/result';

@Injectable()
export class CacheResultService {
    constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

    public async get<T>(key: string): Promise<Result<T, Error>> {
        try {
            const value = await this.cache.get<T>(key);
            if (value === undefined || value === null) {
                return Result.failure(new Error(`Cache miss for key: ${key}`));
            }
            return Result.success(value);
        } catch (error) {
            return Result.failure(error as Error);
        }
    }

    public async set<T>(
        key: string,
        value: T,
        ttl?: number,
    ): Promise<Result<void, Error>> {
        try {
            await this.cache.set(key, value, ttl);
            return Result.success(undefined);
        } catch (error) {
            return Result.failure(error as Error);
        }
    }

    public async clear(): Promise<Result<void, Error>> {
        try {
            await this.cache.clear();
            return Result.success(undefined);
        } catch (error) {
            return Result.failure(error as Error);
        }
    }
}
