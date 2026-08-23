import { HttpStatus, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
    ResilienceCommand,
    CircuitBreakerStrategy,
    BulkheadStrategy,
    TimeoutStrategy,
} from 'nestjs-resilience';
import { CreateAccountCommand } from './command';
import { CreateAccountResponse } from './response.dto';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import type { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { BankAccount, ACCOUNT_STATE } from '@features/accounts/domain/account';
import { AGREEMENT_REPOSITORY } from '@features/agreements/domain/agreement.repository';
import type { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { CacheResultService } from '@core/cache/cache-result.service';

@CommandHandler(CreateAccountCommand)
export class CreateAccountHandler
    extends ResilienceCommand
    implements ICommandHandler<CreateAccountCommand>
{
    public constructor(
        @Inject(BANK_ACCOUNT_REPOSITORY)
        private readonly repository: IBankAccountRepository,
        @Inject(AGREEMENT_REPOSITORY)
        private readonly agreementRepository: IAgreementRepository,
        private readonly cacheResult: CacheResultService,
    ) {
        super([
            new CircuitBreakerStrategy({
                requestVolumeThreshold: 3,
                sleepWindowInMilliseconds: 10_000,
                errorThresholdPercentage: 50,
            }),
            new BulkheadStrategy({ maxConcurrent: 5, maxQueue: 10 }),
            new TimeoutStrategy(5000),
        ]);
    }

    public async run(
        command: CreateAccountCommand,
    ): Promise<CreateAccountResponse> {
        const agreement = await this.agreementRepository.findById(
            command.agreement_id,
        );
        if (!agreement) {
            throw new NotFoundException(
                `Agreement with ID ${command.agreement_id} not found`,
            );
        }

        void this.cacheResult.clear();

        const result = BankAccount.Builder.setId(crypto.randomUUID())
            .setReference(command.reference)
            .setType(command.type)
            .setBalance(0)
            .setState(ACCOUNT_STATE.ACTIVE)
            .setAgreementId(command.agreement_id)
            .setCreatedAt(new Date())
            .setUpdatedAt(new Date())
            .build();

        await this.repository.save(result);

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.CREATED)
            .setMessage('Account created successfully')
            .build();

        return new CreateAccountResponse(result, metadata);
    }
}
