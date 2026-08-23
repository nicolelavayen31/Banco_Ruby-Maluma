import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class InitialMigration1784310420638 implements MigrationInterface {
    name = 'InitialMigration1784310420638';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'agreement',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    { name: 'name', type: 'text', isNullable: false },
                    {
                        name: 'reference',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'state',
                        type: 'text',
                        isNullable: false,
                        default: "'active'",
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'bank_account',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    {
                        name: 'reference',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    { name: 'type', type: 'text', isNullable: false },
                    {
                        name: 'balance',
                        type: 'integer',
                        isNullable: false,
                        default: '0',
                    },
                    {
                        name: 'state',
                        type: 'text',
                        isNullable: false,
                        default: "'active'",
                    },
                    { name: 'agreement_id', type: 'uuid', isNullable: false },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['agreement_id'],
                        referencedTableName: 'agreement',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'transaction',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    { name: 'amount', type: 'integer', isNullable: true },
                    { name: 'operation', type: 'text', isNullable: false },
                    { name: 'type', type: 'text', isNullable: true },
                    {
                        name: 'state',
                        type: 'text',
                        isNullable: false,
                        default: "'pending'",
                    },
                    { name: 'description', type: 'text', isNullable: false },
                    {
                        name: 'bank_account_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    { name: 'correlation_id', type: 'uuid', isNullable: true },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['bank_account_id'],
                        referencedTableName: 'bank_account',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'auth_user',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    {
                        name: 'email',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    { name: 'password_hash', type: 'text', isNullable: false },
                    { name: 'name', type: 'text', isNullable: false },
                    {
                        name: 'state',
                        type: 'text',
                        isNullable: false,
                        default: "'active'",
                    },
                    { name: 'agreement_id', type: 'uuid', isNullable: false },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['agreement_id'],
                        referencedTableName: 'agreement',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'auth_refresh_token',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    {
                        name: 'token_hash',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    { name: 'user_id', type: 'uuid', isNullable: false },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'auth_user',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'auth_profile',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    {
                        name: 'name',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    { name: 'description', type: 'text', isNullable: true },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'auth_permission',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    { name: 'resource', type: 'text', isNullable: false },
                    { name: 'action', type: 'text', isNullable: false },
                    {
                        name: 'name',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
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

        await queryRunner.createTable(
            new Table({
                name: 'user_profile',
                columns: [
                    { name: 'user_id', type: 'uuid', isPrimary: true },
                    { name: 'profile_id', type: 'uuid', isPrimary: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['user_id'],
                        referencedTableName: 'auth_user',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['profile_id'],
                        referencedTableName: 'auth_profile',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'profile_permission',
                columns: [
                    { name: 'profile_id', type: 'uuid', isPrimary: true },
                    { name: 'permission_id', type: 'uuid', isPrimary: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['profile_id'],
                        referencedTableName: 'auth_profile',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                    {
                        columnNames: ['permission_id'],
                        referencedTableName: 'auth_permission',
                        referencedColumnNames: ['id'],
                        onDelete: 'CASCADE',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'api_key',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    {
                        name: 'key_hash',
                        type: 'text',
                        isNullable: false,
                        isUnique: true,
                    },
                    { name: 'prefix', type: 'text', isNullable: false },
                    { name: 'name', type: 'text', isNullable: false },
                    {
                        name: 'state',
                        type: 'text',
                        isNullable: false,
                        default: "'active'",
                    },
                    { name: 'agreement_id', type: 'uuid', isNullable: false },
                    { name: 'created_by', type: 'uuid', isNullable: false },
                    { name: 'profile_id', type: 'uuid', isNullable: false },
                    { name: 'expires_at', type: 'timestamp', isNullable: true },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        isNullable: false,
                        default: 'now()',
                    },
                    { name: 'deleted_at', type: 'timestamp', isNullable: true },
                ],
                foreignKeys: [
                    {
                        columnNames: ['agreement_id'],
                        referencedTableName: 'agreement',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                    {
                        columnNames: ['created_by'],
                        referencedTableName: 'auth_user',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                    {
                        columnNames: ['profile_id'],
                        referencedTableName: 'auth_profile',
                        referencedColumnNames: ['id'],
                        onDelete: 'RESTRICT',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createTable(
            new Table({
                name: 'orders',
                columns: [
                    { name: 'id', type: 'uuid', isPrimary: true },
                    { name: 'customer_name', type: 'text', isNullable: false },
                    { name: 'amount', type: 'integer', isNullable: false },
                    { name: 'status', type: 'text', isNullable: false },
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('orders');
        await queryRunner.dropTable('api_key');
        await queryRunner.dropTable('profile_permission');
        await queryRunner.dropTable('user_profile');
        await queryRunner.dropTable('auth_permission');
        await queryRunner.dropTable('auth_profile');
        await queryRunner.dropTable('auth_refresh_token');
        await queryRunner.dropTable('auth_user');
        await queryRunner.dropTable('transaction');
        await queryRunner.dropTable('bank_account');
        await queryRunner.dropTable('agreement');
    }
}
