import { HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResilienceCommand, TimeoutStrategy } from 'nestjs-resilience';
import { RevokeApiKeyCommand } from './command';
import { RevokeApiKeyResponse } from './response.dto';
import { API_KEY_REPOSITORY } from '@features/auth/domain/api-key.repository';
import type { IApiKeyRepository } from '@features/auth/domain/api-key.repository';
import { ApiKey } from '@features/auth/domain/api-key';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';

@CommandHandler(RevokeApiKeyCommand)
export class RevokeApiKeyHandler
    extends ResilienceCommand
    implements ICommandHandler<RevokeApiKeyCommand>
{
    public constructor(
        @Inject(API_KEY_REPOSITORY)
        private readonly apiKeyRepository: IApiKeyRepository,
        private readonly cacheResult: CacheResultService,
    ) {
        super([new TimeoutStrategy(5000)]);
    }

    public async run(
        command: RevokeApiKeyCommand,
    ): Promise<RevokeApiKeyResponse> {
        const entity = await this.apiKeyRepository.findById(command.id);
        if (!entity) {
            throw new NotFoundException(
                `API key with ID ${command.id} not found`,
            );
        }

        void this.cacheResult.clear();

        entity.state = 'revoked';
        entity.updatedAt = new Date();
        await this.apiKeyRepository.save(entity as unknown as ApiKey);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.OK)
            .setMessage('API key revoked')
            .build();

        return new RevokeApiKeyResponse(entity as unknown as ApiKey, metadata);
    }
}
