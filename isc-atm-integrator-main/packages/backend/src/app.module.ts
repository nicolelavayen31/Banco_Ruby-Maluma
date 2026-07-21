import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { ResilienceModule } from 'nestjs-resilience';
import configuration from '@infrastructure/config/configuration';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { OrdersModule } from './features/orders/orders.module';
import { AgreementsModule } from './features/agreements/agreements.module';
import { BankAccountsModule } from './features/accounts/accounts.module';
import { TransactionsModule } from './features/transactions/transactions.module';
import { AuthModule } from './features/auth/auth.module';
import { NotificationsModule } from '@features/notifications/notifications.module';
import { ConciliationModule } from '@features/conciliation/conciliation.module';
import { AllExceptionsFilter } from '@shared/core/exceptions/exception-filter';
import { HealthModule } from '@infrastructure/health/health.module';

@Module({
    imports: [
        // TODO: ResilienceModule global por ahora. Evaluar mover a módulos
        // individuales (ej. OrdersModule) cuando se necesiten políticas
        // diferentes por feature o se quiera limitar el scope.
        EventEmitterModule.forRoot({ global: true }),
        ResilienceModule.forRoot({}),
        DatabaseModule.forRoot(),
        ClsModule.forRoot({
            global: true,
            middleware: { mount: false, debug: false },
        }),
        ConfigModule.forRoot({
            load: [configuration],
            isGlobal: true,
            cache: true,
        }),
        CacheModule,
        OrdersModule,
        AgreementsModule,
        BankAccountsModule,
        TransactionsModule,
        NotificationsModule,
        HealthModule,
        AuthModule,
        ConciliationModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
    ],
})
export class AppModule {}
