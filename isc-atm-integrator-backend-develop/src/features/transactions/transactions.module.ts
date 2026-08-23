import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransactionEntity } from './infrastructure/persistence/typeorm/transaction.entity';
import { TRANSACTION_REPOSITORY } from './domain/transaction.repository';
import { TransactionRepository } from './infrastructure/persistence/typeorm/transaction.repository';
import { TransactionsController } from './presentation/transactions.controller';
import { CreateTransactionHandler } from './application/commands/create-transaction/handler';
import { TransferHandler } from './application/commands/transfer/handler';
import { UpdateTransactionStateHandler } from './application/commands/update-transaction-state/handler';
import { GetTransactionsHandler } from './application/queries/get-transactions/handler';
import { GetTransactionByIdHandler } from './application/queries/get-transaction-by-id/handler';
import { BankAccountsModule } from '../accounts/accounts.module';
import { CacheResultService } from '@shared/core/cache/cache-result.service';
import { OutboxModule } from '@shared/outbox';

@Module({
    imports: [
        TypeOrmModule.forFeature([TransactionEntity]),
        CqrsModule,
        BankAccountsModule,
        OutboxModule,
    ],
    controllers: [TransactionsController],
    providers: [
        {
            provide: TRANSACTION_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new TransactionRepository(dataSource),
            inject: [DataSource],
        },
        CacheResultService,
        CreateTransactionHandler,
        TransferHandler,
        UpdateTransactionStateHandler,
        GetTransactionsHandler,
        GetTransactionByIdHandler,
    ],
    exports: [TRANSACTION_REPOSITORY],
})
export class TransactionsModule {}
