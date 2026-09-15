import { MigrationInterface, QueryRunner } from "typeorm";

export class UserManagement1789121754401 implements MigrationInterface {
    name = 'UserManagement1789121754401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // status replaces the is_active boolean — backfill before dropping it,
        // otherwise disabled accounts would silently come back as active.
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'invited', 'disabled')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`UPDATE "users" SET "status" = 'disabled' WHERE "is_active" = false`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);

        await queryRunner.query(`ALTER TABLE "users" ADD "invite_token_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "invite_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_7598a4f518e339357042f7e0ed" ON "users" ("invite_token_hash")`);

        // Invited users have no credentials until they accept.
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);

        // The old 'analyst' value has no counterpart in the new enum, so a plain
        // text cast errors out. Map it onto tier1_analyst as part of the cast.
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'tier1_analyst', 'tier2_analyst')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING (CASE "role"::"text" WHEN 'analyst' THEN 'tier1_analyst' ELSE "role"::"text" END)::"public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Both analyst tiers collapse back into the single old 'analyst' role.
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'analyst')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING (CASE "role"::"text" WHEN 'admin' THEN 'admin' ELSE 'analyst' END)::"public"."users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);

        // The old schema has no way to represent a pending invite, and its
        // password_hash is NOT NULL, so those rows cannot be carried back.
        await queryRunner.query(`DELETE FROM "users" WHERE "status" = 'invited'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL`);

        await queryRunner.query(`DROP INDEX "public"."IDX_7598a4f518e339357042f7e0ed"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invite_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "invite_token_hash"`);

        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`UPDATE "users" SET "is_active" = false WHERE "status" = 'disabled'`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    }

}
