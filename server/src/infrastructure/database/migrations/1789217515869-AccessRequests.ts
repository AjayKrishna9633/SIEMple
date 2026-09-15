import { MigrationInterface, QueryRunner } from "typeorm";

export class AccessRequests1789217515869 implements MigrationInterface {
    name = 'AccessRequests1789217515869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."access_requests_status_enum" AS ENUM('pending', 'approved', 'denied')`);
        await queryRunner.query(`CREATE TABLE "access_requests" ("id" uuid NOT NULL, "email" character varying NOT NULL, "full_name" character varying NOT NULL, "reason" text NOT NULL, "status" "public"."access_requests_status_enum" NOT NULL DEFAULT 'pending', "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "decided_at" TIMESTAMP WITH TIME ZONE, "decided_by_user_id" uuid, CONSTRAINT "PK_f89e51c15e3dbea13aa248fe128" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_af42518431964ee61a31761bd4" ON "access_requests"  ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_60918744ee561a9f057747ece1" ON "access_requests"  ("status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_60918744ee561a9f057747ece1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af42518431964ee61a31761bd4"`);
        await queryRunner.query(`DROP TABLE "access_requests"`);
        await queryRunner.query(`DROP TYPE "public"."access_requests_status_enum"`);
    }

}
