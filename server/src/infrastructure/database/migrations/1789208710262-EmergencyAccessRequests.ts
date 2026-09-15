import { MigrationInterface, QueryRunner } from "typeorm";

export class EmergencyAccessRequests1789208710262 implements MigrationInterface {
    name = 'EmergencyAccessRequests1789208710262'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."emergency_access_requests_status_enum" AS ENUM('pending', 'approved', 'denied', 'used')`);
        await queryRunner.query(`CREATE TABLE "emergency_access_requests" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "reason" text NOT NULL, "status" "public"."emergency_access_requests_status_enum" NOT NULL DEFAULT 'pending', "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "decided_at" TIMESTAMP WITH TIME ZONE, "decided_by_user_id" uuid, "grant_expires_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_c4800df0e2cdc0bf02684cc5885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_878ca6e830797fb7ee458a7402" ON "emergency_access_requests"  ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c46b97e2b78188f20083885f5b" ON "emergency_access_requests"  ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c46b97e2b78188f20083885f5b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_878ca6e830797fb7ee458a7402"`);
        await queryRunner.query(`DROP TABLE "emergency_access_requests"`);
        await queryRunner.query(`DROP TYPE "public"."emergency_access_requests_status_enum"`);
    }

}
