import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BankAccountEntity } from './infrastructure/persistence/typeorm/account.entity';
import { BANK_ACCOUNT_REPOSITORY } from './domain/account.repository';
import { BankAccountRepository } from './infrastructure/persistence/typeorm/account.repository';
import { AccountsController } from './presentation/accounts.controller';
import { CreateAccountHandler } from './application/commands/create-account/handler';
import { GetAccountsHandler } from './application/queries/get-accounts/handler';
import { GetAccountByIdHandler } from './application/queries/get-account-by-id/handler';
import { AgreementsModule } from '../agreements/agreements.module';
import { CacheResultService } from '@shared/core/cache/cache-result.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([BankAccountEntity]),
        CqrsModule,
        AgreementsModule,
    ],
    controllers: [AccountsController],
    providers: [
        {
            provide: BANK_ACCOUNT_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new BankAccountRepository(dataSource),
            inject: [DataSource],
        },
        CacheResultService,
        CreateAccountHandler,
        GetAccountsHandler,
        GetAccountByIdHandler,
    ],
    exports: [BANK_ACCOUNT_REPOSITORY],
})
export class BankAccountsModule {}
