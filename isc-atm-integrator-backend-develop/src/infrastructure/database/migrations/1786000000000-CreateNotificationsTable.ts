import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class CreateNotificationsTable1786000000000 implements MigrationInterface {
    name = 'CreateNotificationsTable1786000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'notifications',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    { name: 'type', type: 'varchar', isNullable: false },
                    { name: 'channel', type: 'varchar', isNullable: false },
                    {
                        name: 'recipient_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    { name: 'title', type: 'varchar', isNullable: false },
                    { name: 'body', type: 'text', isNullable: false },
                    { name: 'data', type: 'jsonb', isNullable: true },
                    {
                        name: 'read_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.query(
            `CREATE INDEX "idx_notifications_recipient" ON "notifications" ("recipient_id", "created_at" DESC)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('notifications');
    }
}
