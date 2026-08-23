import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AuthStrategyFactory } from '@shared/bank-auth/auth-strategy.factory';
import type { Agreement } from '@features/agreements/domain/agreement';
import { Result } from '@shared/core/result';

export type ConciliationWebhookState = 'pending' | 'match' | 'mismatch';

export interface TransactionPayload {
    id: string;
    amount?: number;
    operation: string;
    type?: string;
    state: string;
    description: string;
    bankAccountId: string;
    correlationId?: string;
    sourceBank: string;
    fromInnerAccount?: string;
    toInnerAccount?: string;
    conciliationState?: ConciliationWebhookState;
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class BankApiClient {
    private readonly logger = new Logger(BankApiClient.name);

    constructor(private readonly httpService: HttpService) {}

    public async notifyTransaction(
        transaction: TransactionPayload,
        agreement: Agreement,
    ): Promise<Result<void, Error>> {
        if (!agreement.apiUrl) {
            return Result.failure(
                new Error(`No apiUrl configured for agreement ${agreement.id}`),
            );
        }
        if (!agreement.authType || !agreement.authConfig) {
            return Result.failure(
                new Error(`No auth config for agreement ${agreement.id}`),
            );
        }

        try {
            const strategy = AuthStrategyFactory.create(agreement.authType);

            const request = strategy.apply(
                {
                    url: agreement.apiUrl,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                },
                agreement.authConfig,
            );

            const payload = this.buildPayload(transaction);

            const response = await firstValueFrom(
                this.httpService.post(request.url, payload, {
                    headers: request.headers,
                    timeout: 10_000,
                }),
            );

            if (response.status >= 200 && response.status < 300) {
                this.logger.log(
                    `Transaction ${transaction.id} notified to ${agreement.name}`,
                );
                return Result.success(undefined);
            }

            return Result.failure(
                new Error(`Bank API returned status ${response.status}`),
            );
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            this.logger.warn(
                `Failed to notify transaction ${transaction.id}: ${error.message}`,
            );
            return Result.failure(error);
        }
    }

    private buildPayload(transaction: TransactionPayload): Record<string, any> {
        return {
            transactionId: transaction.id,
            amount: transaction.amount,
            operation: transaction.operation,
            type: transaction.type,
            state: transaction.state,
            description: transaction.description,
            bankAccountId: transaction.bankAccountId,
            correlationId: transaction.correlationId,
            sourceBank: transaction.sourceBank,
            fromInnerAccount: transaction.fromInnerAccount,
            toInnerAccount: transaction.toInnerAccount,
            conciliationState: transaction.conciliationState ?? 'pending',
            occurredOn: transaction.updatedAt,
        };
    }
}
