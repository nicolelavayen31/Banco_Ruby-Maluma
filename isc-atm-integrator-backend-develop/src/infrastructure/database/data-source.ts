import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import configuration from '@infrastructure/config/configuration';

import { OrderEntity } from '@features/orders/infrastructure/persistence/typeorm/order.entity';
import { AgreementEntity } from '@features/agreements/infrastructure/persistence/typeorm/agreement.entity';
import { BankAccountEntity } from '@features/accounts/infrastructure/persistence/typeorm/account.entity';
import { TransactionEntity } from '@features/transactions/infrastructure/persistence/typeorm/transaction.entity';
import { AuthUserEntity } from '@features/auth/infrastructure/persistence/typeorm/auth-user.entity';
import { AuthRefreshTokenEntity } from '@features/auth/infrastructure/persistence/typeorm/auth-refresh-token.entity';
import { AuthProfileEntity } from '@features/auth/infrastructure/persistence/typeorm/auth-profile.entity';
import { AuthPermissionEntity } from '@features/auth/infrastructure/persistence/typeorm/auth-permission.entity';
import { UserProfileEntity } from '@features/auth/infrastructure/persistence/typeorm/user-profile.entity';
import { ProfilePermissionEntity } from '@features/auth/infrastructure/persistence/typeorm/profile-permission.entity';
import { ApiKeyEntity } from '@features/auth/infrastructure/persistence/typeorm/api-key.entity';
import { ConciliationEntity } from '@features/conciliation/infrastructure/persistence/typeorm/conciliation.entity';
import { ConciliationMatchEntity } from '@features/conciliation/infrastructure/persistence/typeorm/conciliation-match.entity';
import { OutboxEventEntity } from '@shared/outbox/outbox-event.entity';

const cfg = configuration();
const db = cfg.database;

const baseOptions: DataSourceOptions = {
    type: 'postgres',
    host: db.postgres.host,
    port: db.postgres.port,
    username: db.postgres.username,
    password: db.postgres.password,
    database: db.postgres.name,
    synchronize: false,
};

const options: DataSourceOptions & SeederOptions = {
    ...baseOptions,
    entities: [
        OrderEntity,
        AgreementEntity,
        BankAccountEntity,
        TransactionEntity,
        AuthUserEntity,
        AuthRefreshTokenEntity,
        AuthProfileEntity,
        AuthPermissionEntity,
        UserProfileEntity,
        ProfilePermissionEntity,
        ApiKeyEntity,
        ConciliationEntity,
        ConciliationMatchEntity,
        OutboxEventEntity,
    ],
    migrations: [`${db.migrations.dir}/**/*{.ts,.js}`],
    migrationsTableName: db.migrations.tableName,
    seeds: ['src/infrastructure/database/seeds/**/*{.ts,.js}'],
    factories: ['src/infrastructure/database/factories/**/*{.ts,.js}'],
};

export const dataSource = new DataSource(options);
