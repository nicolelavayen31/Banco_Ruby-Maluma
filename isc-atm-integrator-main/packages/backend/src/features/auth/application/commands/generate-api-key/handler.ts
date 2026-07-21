import { HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { createHash, randomBytes } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import {
    ResilienceCommand,
    BulkheadStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { GenerateApiKeyCommand } from './command';
import { GenerateApiKeyResponse, GenerateApiKeyData } from './response.dto';
import { API_KEY_REPOSITORY } from '@features/auth/domain/api-key.repository';
import type { IApiKeyRepository } from '@features/auth/domain/api-key.repository';
import { ApiKey, API_KEY_STATE } from '@features/auth/domain/api-key';
import { AGREEMENT_REPOSITORY } from '@features/agreements/domain/agreement.repository';
import type { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import { AUTH_PROFILE_REPOSITORY } from '@features/auth/domain/auth-profile.repository';
import type { IAuthProfileRepository } from '@features/auth/domain/auth-profile.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';
import type { IAuthClient } from '@features/auth/domain/auth-client.interface';

@CommandHandler(GenerateApiKeyCommand)
export class GenerateApiKeyHandler
    extends ResilienceCommand
    implements ICommandHandler<GenerateApiKeyCommand>
{
    public constructor(
        @Inject(API_KEY_REPOSITORY)
        private readonly apiKeyRepository: IApiKeyRepository,
        @Inject(AGREEMENT_REPOSITORY)
        private readonly agreementRepository: IAgreementRepository,
        @Inject(AUTH_PROFILE_REPOSITORY)
        private readonly profileRepository: IAuthProfileRepository,
        private readonly cacheResult: CacheResultService,
    ) {
        super([
            new BulkheadStrategy({ maxConcurrent: 3, maxQueue: 5 }),
            new TimeoutStrategy(10_000),
        ]);
    }

    public async run(
        command: GenerateApiKeyCommand,
    ): Promise<GenerateApiKeyResponse> {
        const agreement = await this.agreementRepository.findById(
            command.agreement_id,
        );
        if (!agreement) {
            throw new NotFoundException(
                `Agreement with ID ${command.agreement_id} not found`,
            );
        }

        let profileId = command.profile_id;
        if (!profileId) {
            const defaultProfile =
                await this.profileRepository.findByName('api_client');
            if (defaultProfile) {
                profileId = defaultProfile.id;
            }
        } else {
            const profile = await this.profileRepository.findById(profileId);
            if (!profile) {
                throw new NotFoundException(
                    `Profile with ID ${profileId} not found`,
                );
            }
        }

        void this.cacheResult.clear();

        const rawKey = randomBytes(32).toString('hex');
        const keyHash = createHash('sha256').update(rawKey).digest('hex');
        const prefix = `sk-${rawKey.substring(0, 8)}`;

        const apiKey = ApiKey.Builder.setId(randomUUID())
            .setKeyHash(keyHash)
            .setPrefix(prefix)
            .setName(command.name)
            .setState(API_KEY_STATE.ACTIVE)
            .setAgreementId(command.agreement_id)
            .setCreatedBy('system')
            .setProfileId(profileId ?? '')
            .setCreatedAt(new Date())
            .setUpdatedAt(new Date())
            .build();

        await this.apiKeyRepository.save(apiKey);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.CREATED)
            .setMessage(
                'API key generated. Store it securely — it will not be shown again.',
            )
            .build();

        return new GenerateApiKeyResponse(
            new GenerateApiKeyData(`sk-${rawKey}`, prefix, command.name),
            metadata,
        );
    }
}
