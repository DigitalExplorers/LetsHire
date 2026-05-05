import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class AddCandidateAdminUserForeignKey1776929000000
  implements MigrationInterface
{
  name = 'AddCandidateAdminUserForeignKey1776929000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "candidate"
      SET "admin_user_id" = NULL
      WHERE "admin_user_id" IS NOT NULL
        AND "admin_user_id" NOT IN (SELECT "id" FROM "users")
    `);

    const table = await queryRunner.getTable('candidate');
    const existingForeignKey = table?.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('admin_user_id'),
    );

    if (!existingForeignKey) {
      await queryRunner.createForeignKey(
        'candidate',
        new TableForeignKey({
          name: 'FK_candidate_admin_user',
          columnNames: ['admin_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'NO ACTION',
          onUpdate: 'NO ACTION',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('candidate');
    const foreignKey = table?.foreignKeys.find(
      (existingForeignKey) =>
        existingForeignKey.name === 'FK_candidate_admin_user',
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('candidate', foreignKey);
    }
  }
}
