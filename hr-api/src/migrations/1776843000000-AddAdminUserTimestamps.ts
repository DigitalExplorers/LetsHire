import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdminUserTimestamps1776843000000
  implements MigrationInterface
{
  name = 'AddAdminUserTimestamps1776843000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCreatedAt = await queryRunner.hasColumn('users', 'createdAt');
    if (!hasCreatedAt) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'createdAt',
          type: 'timestamp',
          isNullable: false,
          default: 'now()',
        }),
      );
    }

    const hasUpdatedAt = await queryRunner.hasColumn('users', 'updatedAt');
    if (!hasUpdatedAt) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'updatedAt',
          type: 'timestamp',
          isNullable: false,
          default: 'now()',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasUpdatedAt = await queryRunner.hasColumn('users', 'updatedAt');
    if (hasUpdatedAt) {
      await queryRunner.dropColumn('users', 'updatedAt');
    }

    const hasCreatedAt = await queryRunner.hasColumn('users', 'createdAt');
    if (hasCreatedAt) {
      await queryRunner.dropColumn('users', 'createdAt');
    }
  }
}
