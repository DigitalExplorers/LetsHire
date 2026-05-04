import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserRoleToPositions1776762000000
  implements MigrationInterface
{
  name = 'RenameUserRoleToPositions1776762000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "user_role" RENAME TO "positions"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "positions" RENAME TO "user_role"');
  }
}
