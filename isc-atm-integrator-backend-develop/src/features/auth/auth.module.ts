import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthUserEntity } from './infrastructure/persistence/typeorm/auth-user.entity';
import { AuthRefreshTokenEntity } from './infrastructure/persistence/typeorm/auth-refresh-token.entity';
import { AuthProfileEntity } from './infrastructure/persistence/typeorm/auth-profile.entity';
import { AuthPermissionEntity } from './infrastructure/persistence/typeorm/auth-permission.entity';
import { UserProfileEntity } from './infrastructure/persistence/typeorm/user-profile.entity';
import { ProfilePermissionEntity } from './infrastructure/persistence/typeorm/profile-permission.entity';
import { ApiKeyEntity } from './infrastructure/persistence/typeorm/api-key.entity';

import { AUTH_USER_REPOSITORY } from './domain/auth-user.repository';
import { AUTH_REFRESH_TOKEN_REPOSITORY } from './domain/auth-refresh-token.repository';
import { AUTH_PROFILE_REPOSITORY } from './domain/auth-profile.repository';
import { AUTH_PERMISSION_REPOSITORY } from './domain/auth-permission.repository';
import { API_KEY_REPOSITORY } from './domain/api-key.repository';

import { AuthUserRepository } from './infrastructure/persistence/typeorm/auth-user.repository';
import { AuthRefreshTokenRepository } from './infrastructure/persistence/typeorm/auth-refresh-token.repository';
import { AuthProfileRepository } from './infrastructure/persistence/typeorm/auth-profile.repository';
import { AuthPermissionRepository } from './infrastructure/persistence/typeorm/auth-permission.repository';
import { ApiKeyRepository } from './infrastructure/persistence/typeorm/api-key.repository';

import { AuthController } from './presentation/auth.controller';
import { CsrfTokenController } from './presentation/csrf-token.controller';
import { CsrfService } from './application/csrf.service';
import { LoginHandler } from './application/commands/login/handler';
import { RefreshHandler } from './application/commands/refresh/handler';
import { GenerateApiKeyHandler } from './application/commands/generate-api-key/handler';
import { RevokeApiKeyHandler } from './application/commands/revoke-api-key/handler';
import { GetApiKeysHandler } from './application/queries/get-api-keys/handler';

import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { ApiKeyStrategy } from './passport/api-key.strategy';
import { JwtAuthGuard } from './passport/guards/jwt-auth.guard';
import { ApiKeyAuthGuard } from './passport/guards/api-key-auth.guard';
import { CombinedAuthGuard } from './passport/guards/combined-auth.guard';
import { PermissionsGuard } from './presentation/permissions.guard';

import { AgreementsModule } from '../agreements/agreements.module';
import { CacheResultService } from '@shared/core/cache/cache-result.service';

import type { AppConfigService } from '@shared/core/types';

const authEntities = [
    AuthUserEntity,
    AuthRefreshTokenEntity,
    AuthProfileEntity,
    AuthPermissionEntity,
    UserProfileEntity,
    ProfilePermissionEntity,
    ApiKeyEntity,
];

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature(authEntities),
        CqrsModule,
        PassportModule,
        AgreementsModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const cfg = configService as unknown as AppConfigService;
                return {
                    secret: cfg.get('security.jwt.secret', { infer: true }),
                    signOptions: {
                        expiresIn: cfg.get('security.jwt.expiresIn', {
                            infer: true,
                        }),
                    },
                };
            },
        }),
    ],
    controllers: [AuthController, CsrfTokenController],
    providers: [
        {
            provide: AUTH_USER_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new AuthUserRepository(dataSource),
            inject: [DataSource],
        },
        {
            provide: AUTH_REFRESH_TOKEN_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new AuthRefreshTokenRepository(dataSource),
            inject: [DataSource],
        },
        {
            provide: AUTH_PROFILE_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new AuthProfileRepository(dataSource),
            inject: [DataSource],
        },
        {
            provide: AUTH_PERMISSION_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new AuthPermissionRepository(dataSource),
            inject: [DataSource],
        },
        {
            provide: API_KEY_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new ApiKeyRepository(dataSource),
            inject: [DataSource],
        },
        CacheResultService,
        CsrfService,
        LocalStrategy,
        JwtStrategy,
        ApiKeyStrategy,
        LoginHandler,
        RefreshHandler,
        GenerateApiKeyHandler,
        RevokeApiKeyHandler,
        GetApiKeysHandler,
        JwtAuthGuard,
        ApiKeyAuthGuard,
        CombinedAuthGuard,
        PermissionsGuard,
    ],
    exports: [
        AUTH_USER_REPOSITORY,
        AUTH_PROFILE_REPOSITORY,
        AUTH_PERMISSION_REPOSITORY,
        API_KEY_REPOSITORY,
        JwtAuthGuard,
        ApiKeyAuthGuard,
        CombinedAuthGuard,
        PermissionsGuard,
    ],
})
export class AuthModule {}
