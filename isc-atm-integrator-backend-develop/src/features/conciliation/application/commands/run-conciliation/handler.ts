import { HttpStatus, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CONCILIATION_REPOSITORY } from '../../../domain/conciliation.repository';
import type { IConciliationRepository } from '../../../domain/conciliation.repository';
import { Conciliation } from '../../../domain/conciliation';
import { ConciliationMatch } from '../../../domain/conciliation-match';
import { classifyPair } from '../../../domain/match-classifier';
import { TRANSACTION_REPOSITORY } from '@features/transactions/domain/transaction.repository';
import type { ITransactionRepository } from '@features/transactions/domain/transaction.repository';
import type { TransactionEntity } from '@features/transactions/infrastructure/persistence/typeorm/transaction.entity';
import { RunConciliationCommand } from './command';
import { ConciliationResponse } from '../../queries/get-conciliations/response.dto';
import { ResponseMetadataBuilder } from '@shared/core/response/api-response-metadata-builder';
import { ConciliationCompletedEvent } from '@features/conciliation/application/events/conciliation-completed.event';
import { BANK_ACCOUNT_REPOSITORY } from '@features/accounts/domain/account.repository';
import type { IBankAccountRepository } from '@features/accounts/domain/account.repository';
import { OutboxService } from '@shared/outbox';
import type { ConciliationWebhookState } from '@shared/bank-api/bank-api.client';

@CommandHandler(RunConciliationCommand)
export class RunConciliationHandler implements ICommandHandler<RunConciliationCommand> {
    public constructor(
        @Inject(CONCILIATION_REPOSITORY)
        private readonly conciliationRepository: IConciliationRepository,
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
        @Inject(BANK_ACCOUNT_REPOSITORY)
        private readonly accountRepository: IBankAccountRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly outboxService: OutboxService,
    ) {}

    public async execute(
        _command: RunConciliationCommand,
    ): Promise<ConciliationResponse> {
        const bankATxs = (
            await this.transactionRepository.findAll(
                1,
                10000,
                undefined,
                undefined,
                undefined,
                undefined,
                'bank_a',
            )
        ).items;
        const bankBTxs = (
            await this.transactionRepository.findAll(
                1,
                10000,
                undefined,
                undefined,
                undefined,
                undefined,
                'bank_b',
            )
        ).items;

        const bankBMap = new Map(
            bankBTxs
                .filter((t) => t.correlationId)
                .map((t) => [t.correlationId!, t]),
        );

        let matched = 0;
        let discrepancies = 0;
        let missing = 0;
        const matchBuilders: ConciliationMatch[] = [];
        const conciliationId = crypto.randomUUID();

        for (const txA of bankATxs) {
            if (!txA.correlationId) continue;

            const txB = bankBMap.get(txA.correlationId);
            if (!txB) {
                missing++;
                matchBuilders.push(
                    ConciliationMatch.Builder.setId(crypto.randomUUID())
                        .setConciliationId(conciliationId)
                        .setInternalTxId(txA.id)
                        .setStatus('missing')
                        .setAmountDiff(0)
                        .build(),
                );
                continue;
            }

            const { status, amountDiff } = classifyPair(txA, txB);
            if (status === 'matched') {
                matched++;
            } else {
                discrepancies++;
            }

            matchBuilders.push(
                ConciliationMatch.Builder.setId(crypto.randomUUID())
                    .setConciliationId(conciliationId)
                    .setInternalTxId(txA.id)
                    .setExternalTxId(txB.id)
                    .setStatus(status)
                    .setAmountDiff(amountDiff)
                    .build(),
            );
            bankBMap.delete(txA.correlationId);
        }

        for (const [, txB] of bankBMap) {
            missing++;
            matchBuilders.push(
                ConciliationMatch.Builder.setId(crypto.randomUUID())
                    .setConciliationId(conciliationId)
                    .setInternalTxId(txB.id)
                    .setStatus('missing')
                    .setAmountDiff(0)
                    .build(),
            );
        }

        const conciliation = Conciliation.Builder.setId(conciliationId)
            .setRunAt(new Date())
            .setStatus('completed')
            .setSummary({ matched, discrepancies, missing })
            .build();

        await this.conciliationRepository.createConciliation(conciliation);

        for (const match of matchBuilders) {
            await this.conciliationRepository.createMatch(match);
        }

        const processedIds = new Set<string>();
        for (const match of matchBuilders) {
            if (match.status === 'missing') continue;

            const conciliationState =
                match.status === 'matched' ? 'match' : 'mismatch';
            const eventType =
                match.status === 'matched'
                    ? 'transaction.completed'
                    : 'transaction.conciliation_mismatch';

            if (match.internalTxId && !processedIds.has(match.internalTxId)) {
                processedIds.add(match.internalTxId);
                const txA = bankATxs.find((t) => t.id === match.internalTxId);
                if (txA) {
                    await this.notifyConciliationResult(
                        txA,
                        eventType,
                        conciliationState,
                    );
                }
            }

            if (match.externalTxId && !processedIds.has(match.externalTxId)) {
                processedIds.add(match.externalTxId);
                const txB = bankBTxs.find((t) => t.id === match.externalTxId);
                if (txB) {
                    await this.notifyConciliationResult(
                        txB,
                        eventType,
                        conciliationState,
                    );
                }
            }
        }

        this.eventEmitter.emit(
            ConciliationCompletedEvent.eventName,
            new ConciliationCompletedEvent(conciliationId, 'completed', {
                matched,
                discrepancies,
                missing,
            }),
        );

        const metadata = new ResponseMetadataBuilder()
            .setStatusCode(HttpStatus.CREATED)
            .setMessage('Conciliation completed')
            .build();

        return new ConciliationResponse(
            (await this.conciliationRepository.findById(
                conciliationId,
            )) as NonNullable<
                Awaited<ReturnType<IConciliationRepository['findById']>>
            >,
            metadata,
        );
    }

    private async notifyConciliationResult(
        tx: TransactionEntity,
        eventType: string,
        conciliationState: ConciliationWebhookState,
    ): Promise<void> {
        const account = await this.accountRepository.findById(tx.bankAccountId);
        await this.outboxService.save({
            aggregateId: tx.id,
            eventType,
            payload: {
                transaction: {
                    id: tx.id,
                    amount: tx.amount,
                    operation: tx.operation,
                    type: tx.type,
                    state: tx.state,
                    description: tx.description,
                    bankAccountId: tx.bankAccountId,
                    correlationId: tx.correlationId,
                    sourceBank: tx.sourceBank,
                    conciliationState,
                    createdAt: tx.createdAt.toISOString(),
                    updatedAt: tx.updatedAt.toISOString(),
                },
                agreementId: account?.agreementId,
            },
        });
    }
}
