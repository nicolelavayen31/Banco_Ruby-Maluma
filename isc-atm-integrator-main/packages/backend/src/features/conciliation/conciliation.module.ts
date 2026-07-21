import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConciliationEntity } from './infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from './infrastructure/persistence/typeorm/conciliation-match.entity';
import { CONCILIATION_REPOSITORY } from './domain/conciliation.repository';
import { ConciliationRepository } from './infrastructure/persistence/typeorm/conciliation.repository';
import { ConciliationController } from './presentation/conciliation.controller';
import { RunConciliationHandler } from './application/commands/run-conciliation/handler';
import { ResolveDiscrepancyHandler } from './application/commands/resolve-discrepancy/handler';
import { GetConciliationsHandler } from './application/queries/get-conciliations/handler';
import { GetConciliationReportHandler } from './application/queries/get-conciliation-report/handler';
import { TransactionsModule } from '@features/transactions/transactions.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ConciliationEntity, ConciliationMatchEntity]),
        CqrsModule,
        TransactionsModule,
    ],
    controllers: [ConciliationController],
    providers: [
        { provide: CONCILIATION_REPOSITORY, useFactory: (ds: DataSource) => new ConciliationRepository(ds), inject: [DataSource] },
        RunConciliationHandler,
        ResolveDiscrepancyHandler,
        GetConciliationsHandler,
        GetConciliationReportHandler,
    ],
})
export class ConciliationModule {}
