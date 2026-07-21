import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import type { AppConfigService } from '@shared/core/types';

@Module({})
export class DatabaseModule {
    static forRoot(): DynamicModule {
        return {
            module: DatabaseModule,
            imports: [
                TypeOrmModule.forRootAsync({
                    inject: [ConfigService],
                    useFactory: (configService: AppConfigService) => {
                        const pg = configService.get('database.postgres', {
                            infer: true,
                        });
                        const isDev = configService.get('app.isDevMode', {
                            infer: true,
                        });

                        return {
                            type: 'postgres',
                            host: pg.host,
                            port: pg.port,
                            username: pg.username,
                            password: pg.password,
                            database: pg.name,
                            autoLoadEntities: true,
                            synchronize: isDev,
                            connectTimeoutMS: 5000,
                            retryAttempts: 5,

                            migrations: [
                                `${configService.get('database.migrations.dir', { infer: true })}/**/*{.ts,.js}`,
                            ],
                            migrationsTableName: configService.get(
                                'database.migrations.tableName',
                                { infer: true },
                            ),
                        };
                    },
                }),
            ],
        };
    }
}
