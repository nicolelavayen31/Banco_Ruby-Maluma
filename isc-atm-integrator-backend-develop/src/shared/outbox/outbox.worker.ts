import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import {
    BankApiClient,
    type TransactionPayload,
} from '@shared/bank-api/bank-api.client';
import { AGREEMENT_REPOSITORY } from '@features/agreements/domain/agreement.repository';
import type { IAgreementRepository } from '@features/agreements/domain/agreement.repository';
import type { Agreement } from '@features/agreements/domain/agreement';

@Injectable()
export class OutboxWorker {
    private readonly logger = new Logger(OutboxWorker.name);

    constructor(
        private readonly outboxService: OutboxService,
        private readonly bankApi: BankApiClient,
        @Inject(AGREEMENT_REPOSITORY)
        private readonly agreementRepository: IAgreementRepository,
    ) {}

    @Interval(5000)
    public async tick(): Promise<void> {
        const pending = await this.outboxService.findPending(10);
        if (pending.length === 0) return;

        this.logger.log(`Outbox worker processing ${pending.length} events`);

        for (const event of pending) {
            await this.processEvent(event);
        }
    }

    private async processEvent(event: {
        id: string;
        payload: Record<string, any>;
        retryCount: number;
        maxRetries: number;
    }): Promise<void> {
        const agreementId: string | undefined = event.payload.agreementId as
            string | undefined;
        if (!agreementId) {
            this.logger.warn(
                `Event ${event.id} missing agreementId, marking dead_letter`,
            );
            await this.outboxService.markStatus(event.id, 'dead_letter');
            return;
        }

        const entity = await this.agreementRepository.findById(agreementId);
        if (!entity) {
            this.logger.warn(
                `Agreement ${agreementId} not found for event ${event.id}, marking dead_letter`,
            );
            await this.outboxService.markStatus(event.id, 'dead_letter');
            return;
        }

        const txPayload: TransactionPayload = event.payload
            .transaction as TransactionPayload;

        const result = await this.bankApi.notifyTransaction(
            txPayload,
            entity as unknown as Agreement,
        );

        if (result.isSuccess()) {
            await this.outboxService.markStatus(event.id, 'sent');
            this.logger.log(`Event ${event.id} sent to ${entity.name}`);
        } else {
            await this.outboxService.incrementRetry(event.id);
            const newRetry = event.retryCount + 1;
            if (newRetry >= event.maxRetries) {
                await this.outboxService.markStatus(event.id, 'dead_letter');
                this.logger.warn(
                    `Event ${event.id} reached max retries, moved to dead_letter`,
                );
            } else {
                this.logger.warn(
                    `Event ${event.id} send failed (retry ${newRetry}/${event.maxRetries})`,
                );
            }
        }
    }
}
