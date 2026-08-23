import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOutboxEventTable1787000000001 implements MigrationInterface {
    name = 'CreateOutboxEventTable1787000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const exists = await queryRunner.hasTable('outbox_event');
        if (!exists) {
            await queryRunner.query(`
                CREATE TABLE "outbox_event" (
                    "id" uuid NOT NULL,
                    "aggregate_id" uuid NOT NULL,
                    "event_type" varchar(100) NOT NULL,
                    "payload" jsonb NOT NULL,
                    "status" varchar(20) NOT NULL DEFAULT 'pending',
                    "retry_count" integer NOT NULL DEFAULT 0,
                    "max_retries" integer NOT NULL DEFAULT 5,
                    "last_attempt_at" timestamp,
                    "created_at" timestamp NOT NULL DEFAULT now(),
                    CONSTRAINT "PK_outbox_event" PRIMARY KEY ("id")
                )
            `);
            await queryRunner.query(`
                CREATE INDEX "IDX_outbox_event_status" ON "outbox_event" ("status")
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('outbox_event');
    }
}
