import { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordReset1789228397507 implements MigrationInterface {
    name = 'PasswordReset1789228397507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token_hash" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_expires_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_fed7c6bd316b83a0b8580cd1ca" ON "users"  ("password_reset_token_hash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fed7c6bd316b83a0b8580cd1ca"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expires_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token_hash"`);
    }

}
