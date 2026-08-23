import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Inject } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { API_KEY_REPOSITORY } from '@features/auth/domain/api-key.repository';
import type { IApiKeyRepository } from '@features/auth/domain/api-key.repository';
import { AUTH_PERMISSION_REPOSITORY } from '@features/auth/domain/auth-permission.repository';
import type { IAuthPermissionRepository } from '@features/auth/domain/auth-permission.repository';
import type { IAuthClient } from '../domain/auth-client.interface';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
    constructor(
        @Inject(API_KEY_REPOSITORY)
        private readonly apiKeyRepository: IApiKeyRepository,
        @Inject(AUTH_PERMISSION_REPOSITORY)
        private readonly permissionRepository: IAuthPermissionRepository,
    ) {
        super();
    }

    public async validate(req: any): Promise<IAuthClient> {
        const rawKey = req.headers?.['x-api-key'] as string | undefined;
        if (!rawKey) {
            throw new UnauthorizedException('Missing x-api-key header');
        }

        const stripped = rawKey.startsWith('sk-')
            ? rawKey.substring(3)
            : rawKey;
        const keyHash = createHash('sha256').update(stripped).digest('hex');

        const apiKey = await this.apiKeyRepository.findByHash(keyHash);
        if (!apiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        if (apiKey.state !== 'active') {
            throw new UnauthorizedException('API key is revoked');
        }

        if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            throw new UnauthorizedException('API key has expired');
        }

        let permissions: string[] = [];
        if (apiKey.profileId) {
            const perms = await this.permissionRepository.findByProfileId(
                apiKey.profileId,
            );
            permissions = perms.map((p) => p.name);
        }

        return {
            authType: 'api_key',
            apiKeyId: apiKey.id,
            agreementId: apiKey.agreementId,
            permissions,
        };
    }
}
