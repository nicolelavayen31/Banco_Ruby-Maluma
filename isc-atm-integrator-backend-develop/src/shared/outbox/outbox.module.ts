import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OutboxEventEntity } from './outbox-event.entity';
import { OUTBOX_REPOSITORY } from './outbox.repository';
import { OutboxTypeOrmRepository } from './outbox.typeorm.repository';
import { OutboxService } from './outbox.service';
import { OutboxWorker } from './outbox.worker';
import { OutboxController } from './outbox.controller';
import { BankApiModule } from '@shared/bank-api/bank-api.module';
import { AgreementsModule } from '@features/agreements/agreements.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OutboxEventEntity]),
        ScheduleModule,
        BankApiModule,
        AgreementsModule,
    ],
    controllers: [OutboxController],
    providers: [
        {
            provide: OUTBOX_REPOSITORY,
            useFactory: (dataSource: DataSource) =>
                new OutboxTypeOrmRepository(dataSource),
            inject: [DataSource],
        },
        OutboxService,
        OutboxWorker,
    ],
    exports: [OutboxService, OUTBOX_REPOSITORY],
})
export class OutboxModule {}
