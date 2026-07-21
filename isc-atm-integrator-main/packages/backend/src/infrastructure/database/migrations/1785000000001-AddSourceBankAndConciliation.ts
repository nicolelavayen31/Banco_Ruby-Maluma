import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableForeignKey } from 'typeorm';

export class AddSourceBankAndConciliation1785000000001 implements MigrationInterface {
    name = 'AddSourceBankAndConciliation1785000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "source_bank" varchar(10) NOT NULL DEFAULT 'bank_a'`,
        );

        const hasConciliations = await queryRunner.hasTable('conciliations');
        if (!hasConciliations) {
            await queryRunner.createTable(
                new Table({
                    name: 'conciliations',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true },
                        {
                            name: 'run_at',
                            type: 'timestamp',
                            isNullable: false,
                            default: 'now()',
                        },
                        {
                            name: 'status',
                            type: 'varchar',
                            isNullable: false,
                            default: "'pending'",
                        },
                        {
                            name: 'summary',
                            type: 'jsonb',
                            isNullable: false,
                            default: "'{}'",
                        },
                    ],
                }),
            );
        }

        const hasMatches = await queryRunner.hasTable('conciliation_matches');
        if (!hasMatches) {
            await queryRunner.createTable(
                new Table({
                    name: 'conciliation_matches',
                    columns: [
                        { name: 'id', type: 'uuid', isPrimary: true },
                        {
                            name: 'conciliation_id',
                            type: 'uuid',
                            isNullable: false,
                        },
                        {
                            name: 'internal_tx_id',
                            type: 'uuid',
                            isNullable: false,
                        },
                        {
                            name: 'external_tx_id',
                            type: 'uuid',
                            isNullable: true,
                        },
                        { name: 'status', type: 'varchar', isNullable: false },
                        {
                            name: 'amount_diff',
                            type: 'integer',
                            isNullable: false,
                            default: 0,
                        },
                        { name: 'notes', type: 'text', isNullable: true },
                    ],
                }),
            );

            await queryRunner.createForeignKey(
                'conciliation_matches',
                new TableForeignKey({
                    name: 'FK_conciliation_matches_conciliation',
                    columnNames: ['conciliation_id'],
                    referencedTableName: 'conciliations',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "transaction" DROP COLUMN IF EXISTS "source_bank"`,
        );
        await queryRunner.dropTable('conciliation_matches');
        await queryRunner.dropTable('conciliations');
    }
}
