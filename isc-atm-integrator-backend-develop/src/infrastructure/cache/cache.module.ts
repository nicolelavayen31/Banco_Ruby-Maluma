import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { AppConfigService } from '@shared/core/types';

@Module({
    imports: [
        NestCacheModule.registerAsync({
            isGlobal: true,
            inject: [ConfigService],
            useFactory: (configService: AppConfigService) => {
                const redisHost = configService.get('cache.redis.host', {
                    infer: true,
                });

                const cacheTTL = configService.get('cache.redis.ttl', {
                    infer: true,
                });

                return {
                    stores: [
                        new KeyvRedis({
                            url: redisHost,
                            socket: {
                                connectTimeout: 5000,
                                reconnectStrategy: false,
                            },
                        }),
                    ],
                    ttl: cacheTTL,
                };
            },
        }),
    ],
})
export class CacheModule {}
