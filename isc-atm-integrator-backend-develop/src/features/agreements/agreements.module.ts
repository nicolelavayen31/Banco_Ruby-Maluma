import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AgreementEntity } from './infrastructure/persistence/typeorm/agreement.entity';
import { AGREEMENT_REPOSITORY } from './domain/agreement.repository';
import { AgreementRepository } from './infrastructure/persistence/typeorm/agreement.repository';
import { AgreementsController } from './presentation/agreements.controller';
import { CreateAgreementHandler } from './application/commands/create-agreement/handler';
import { GetAgreementsHandler } from './application/queries/get-agreements/handler';
import { GetAgreementByIdHandler } from './application/queries/get-agreement-by-id/handler';
import { CacheResultService } from '@shared/core/cache/cache-result.service';

@Module({
    imports: [TypeOrmModule.forFeature([AgreementEntity]), CqrsModule],
    controllers: [AgreementsController],
    providers: [
        {
            provide: AGREEMENT_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new AgreementRepository(dataSource),
            inject: [DataSource],
        },
        CacheResultService,
        CreateAgreementHandler,
        GetAgreementsHandler,
        GetAgreementByIdHandler,
    ],
    exports: [AGREEMENT_REPOSITORY],
})
export class AgreementsModule {}
