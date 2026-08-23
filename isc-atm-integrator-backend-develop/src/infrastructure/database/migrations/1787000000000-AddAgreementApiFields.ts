import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgreementApiFields1787000000000 implements MigrationInterface {
    name = 'AddAgreementApiFields1787000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "agreement" ADD COLUMN IF NOT EXISTS "api_url" varchar(255)`,
        );
        await queryRunner.query(
            `ALTER TABLE "agreement" ADD COLUMN IF NOT EXISTS "auth_type" varchar(20)`,
        );
        await queryRunner.query(
            `ALTER TABLE "agreement" ADD COLUMN IF NOT EXISTS "auth_config" jsonb`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "agreement" DROP COLUMN IF EXISTS "api_url"`,
        );
        await queryRunner.query(
            `ALTER TABLE "agreement" DROP COLUMN IF EXISTS "auth_type"`,
        );
        await queryRunner.query(
            `ALTER TABLE "agreement" DROP COLUMN IF EXISTS "auth_config"`,
        );
    }
}
