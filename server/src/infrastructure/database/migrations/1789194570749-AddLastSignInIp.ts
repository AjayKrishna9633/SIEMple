import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastSignInIp1789194570749 implements MigrationInterface {
    name = 'AddLastSignInIp1789194570749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "last_sign_in_ip" character varying(45)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_sign_in_ip"`);
    }

}
