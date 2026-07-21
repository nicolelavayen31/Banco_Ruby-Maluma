import type { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'node:crypto';

interface IdRow {
    id: string;
}

export class UpdatePermissionNames1784325756553 implements MigrationInterface {
    name = 'UpdatePermissionNames1784325756553';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE auth_permission
             SET resource = 'accounts',
                 name = REPLACE(name, 'bank_accounts:', 'accounts:')
             WHERE resource = 'bank_accounts'`,
        );

        const orderPerms = [
            { resource: 'orders', action: 'read', name: 'orders:read' },
            { resource: 'orders', action: 'write', name: 'orders:write' },
            { resource: 'orders', action: 'delete', name: 'orders:delete' },
        ];

        for (const perm of orderPerms) {
            const existing = (await queryRunner.query(
                `SELECT id FROM auth_permission WHERE name = $1`,
                [perm.name],
            )) as IdRow[];

            if (existing.length === 0) {
                await queryRunner.query(
                    `INSERT INTO auth_permission (id, resource, action, name, created_at)
                     VALUES ($1, $2, $3, $4, now())`,
                    [randomUUID(), perm.resource, perm.action, perm.name],
                );
            }
        }

        const adminProfiles = (await queryRunner.query(
            `SELECT id FROM auth_profile WHERE name = 'admin'`,
        )) as IdRow[];

        if (adminProfiles.length > 0) {
            const adminProfileId = adminProfiles[0].id;
            const orderPermRows = (await queryRunner.query(
                `SELECT id FROM auth_permission WHERE resource = 'orders'`,
            )) as IdRow[];

            for (const perm of orderPermRows) {
                const existing = (await queryRunner.query(
                    `SELECT 1 FROM profile_permission
                     WHERE profile_id = $1 AND permission_id = $2`,
                    [adminProfileId, perm.id],
                )) as IdRow[];

                if (existing.length === 0) {
                    await queryRunner.query(
                        `INSERT INTO profile_permission (profile_id, permission_id)
                         VALUES ($1, $2)`,
                        [adminProfileId, perm.id],
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE auth_permission
             SET resource = 'bank_accounts',
                 name = REPLACE(name, 'accounts:', 'bank_accounts:')
             WHERE resource = 'accounts'
               AND name LIKE 'accounts:%'`,
        );

        const orderPermRows = (await queryRunner.query(
            `SELECT id FROM auth_permission WHERE resource = 'orders'`,
        )) as IdRow[];

        for (const perm of orderPermRows) {
            await queryRunner.query(
                `DELETE FROM profile_permission WHERE permission_id = $1`,
                [perm.id],
            );
            await queryRunner.query(
                `DELETE FROM auth_permission WHERE id = $1`,
                [perm.id],
            );
        }
    }
}
