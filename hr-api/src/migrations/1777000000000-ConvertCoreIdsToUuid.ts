import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableUnique,
} from 'typeorm';

type IdTable = {
  tableName: string;
  tempColumn: string;
};

type RefColumn = {
  tableName: string;
  columnName: string;
  targetTable: string;
  targetTempColumn: string;
  nullable?: boolean;
  foreignKeyName?: string;
  onDelete?: string;
};

export class ConvertCoreIdsToUuid1777000000000 implements MigrationInterface {
  name = 'ConvertCoreIdsToUuid1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    const idTables: IdTable[] = [
      { tableName: 'organization', tempColumn: 'uuid_id' },
      { tableName: 'users', tempColumn: 'uuid_id' },
      { tableName: 'candidate', tempColumn: 'uuid_id' },
      { tableName: 'interviewer', tempColumn: 'uuid_id' },
      { tableName: 'positions', tempColumn: 'uuid_id' },
    ];

    for (const table of idTables) {
      await queryRunner.query(
        `ALTER TABLE "${table.tableName}" ADD COLUMN "${table.tempColumn}" uuid`,
      );
      await queryRunner.query(
        `UPDATE "${table.tableName}" SET "${table.tempColumn}" = gen_random_uuid() WHERE "${table.tempColumn}" IS NULL`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table.tableName}" ALTER COLUMN "${table.tempColumn}" SET NOT NULL`,
      );
    }

    const refColumns: RefColumn[] = [
      { tableName: 'users', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_users_organization_uuid' },
      { tableName: 'candidate', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_candidate_organization_uuid' },
      { tableName: 'candidate', columnName: 'admin_user_id', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_candidate_admin_user' },
      { tableName: 'candidate', columnName: 'assignedInterviewerId', targetTable: 'interviewer', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_candidate_interviewer_uuid', onDelete: 'SET NULL' },
      { tableName: 'candidate', columnName: 'roleId', targetTable: 'positions', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_candidate_role_uuid' },
      { tableName: 'interviewer', columnName: 'createdById', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_interviewer_created_by_uuid' },
      { tableName: 'interviewer', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_interviewer_organization_uuid' },
      { tableName: 'interview', columnName: 'candidateId', targetTable: 'candidate', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_interview_candidate_uuid', onDelete: 'CASCADE' },
      { tableName: 'interview', columnName: 'interviewerId', targetTable: 'interviewer', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_interview_interviewer_uuid', onDelete: 'CASCADE' },
      { tableName: 'interview', columnName: 'createdById', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_interview_created_by_uuid' },
      { tableName: 'interview', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_interview_organization_uuid' },
      { tableName: 'positions', columnName: 'createdById', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_positions_created_by_uuid' },
      { tableName: 'positions', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_positions_organization_uuid' },
      { tableName: 'quiz', columnName: 'roleId', targetTable: 'positions', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_quiz_role_uuid', onDelete: 'CASCADE' },
      { tableName: 'quiz', columnName: 'createdById', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_quiz_created_by_uuid', onDelete: 'CASCADE' },
      { tableName: 'quiz', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_quiz_organization_uuid' },
      { tableName: 'quiz_config', columnName: 'roleId', targetTable: 'positions', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_quiz_config_role_uuid', onDelete: 'CASCADE' },
      { tableName: 'quiz_config', columnName: 'createdById', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_quiz_config_created_by_uuid', onDelete: 'CASCADE' },
      { tableName: 'quiz_config', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_quiz_config_organization_uuid' },
      { tableName: 'feedback', columnName: 'candidateId', targetTable: 'candidate', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_feedback_candidate_uuid', onDelete: 'CASCADE' },
      { tableName: 'feedback', columnName: 'submittedById', targetTable: 'users', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_feedback_submitted_by_uuid', onDelete: 'SET NULL' },
      { tableName: 'score', columnName: 'userId', targetTable: 'candidate', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_score_user_uuid' },
      { tableName: 'candidate_test_attempt', columnName: 'candidateId', targetTable: 'candidate', targetTempColumn: 'uuid_id', nullable: true, foreignKeyName: 'FK_attempt_candidate_uuid', onDelete: 'CASCADE' },
      { tableName: 'reset_token', columnName: 'userId', targetTable: 'users', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_reset_token_user_uuid' },
      { tableName: 'registration_link', columnName: 'adminId', targetTable: 'users', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_registration_link_admin_uuid' },
      { tableName: 'registration_link', columnName: 'organizationId', targetTable: 'organization', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_registration_link_organization_uuid' },
      { tableName: 'registration_link', columnName: 'roleId', targetTable: 'positions', targetTempColumn: 'uuid_id', foreignKeyName: 'FK_registration_link_role_uuid' },
    ];

    for (const ref of refColumns) {
      await queryRunner.query(
        `ALTER TABLE "${ref.tableName}" ADD COLUMN "${ref.columnName}_uuid" uuid`,
      );
      await queryRunner.query(`
        UPDATE "${ref.tableName}" AS ref
        SET "${ref.columnName}_uuid" = target."${ref.targetTempColumn}"
        FROM "${ref.targetTable}" AS target
        WHERE ref."${ref.columnName}" IS NOT NULL
          AND target."id"::text = ref."${ref.columnName}"::text
      `);
    }

    await this.dropForeignKeys(queryRunner, refColumns);
    await this.dropUniqueConstraints(queryRunner, 'users', ['organizationId']);
    await this.dropUniqueConstraints(queryRunner, 'candidate', ['admin_user_id']);

    for (const ref of refColumns) {
      await queryRunner.query(
        `ALTER TABLE "${ref.tableName}" DROP COLUMN "${ref.columnName}"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${ref.tableName}" RENAME COLUMN "${ref.columnName}_uuid" TO "${ref.columnName}"`,
      );
    }

    for (const table of idTables) {
      await queryRunner.dropPrimaryKey(table.tableName);
      await queryRunner.query(`ALTER TABLE "${table.tableName}" DROP COLUMN "id"`);
      await queryRunner.query(
        `ALTER TABLE "${table.tableName}" RENAME COLUMN "${table.tempColumn}" TO "id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table.tableName}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table.tableName}" ADD PRIMARY KEY ("id")`,
      );
    }

    await queryRunner.createUniqueConstraint(
      'users',
      new TableUnique({
        name: 'UQ_users_email_organization_uuid',
        columnNames: ['email', 'organizationId'],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'candidate',
      new TableUnique({
        name: 'UQ_candidate_email_admin_uuid',
        columnNames: ['email', 'admin_user_id'],
      }),
    );

    for (const ref of refColumns) {
      if (!ref.foreignKeyName) {
        continue;
      }

      await queryRunner.createForeignKey(
        ref.tableName,
        new TableForeignKey({
          name: ref.foreignKeyName,
          columnNames: [ref.columnName],
          referencedTableName: ref.targetTable,
          referencedColumnNames: ['id'],
          onDelete: ref.onDelete,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      'This UUID migration is not automatically reversible. Restore from backup before reverting.',
    );
  }

  private async dropForeignKeys(
    queryRunner: QueryRunner,
    refs: RefColumn[],
  ): Promise<void> {
    const refsByTable = new Map<string, string[]>();

    for (const ref of refs) {
      const columns = refsByTable.get(ref.tableName) ?? [];
      columns.push(ref.columnName);
      refsByTable.set(ref.tableName, columns);
    }

    for (const [tableName, columns] of refsByTable.entries()) {
      const table = await queryRunner.getTable(tableName);
      if (!table) {
        continue;
      }

      const foreignKeys = table.foreignKeys.filter((foreignKey) =>
        foreignKey.columnNames.some((columnName) => columns.includes(columnName)),
      );

      if (foreignKeys.length > 0) {
        await queryRunner.dropForeignKeys(tableName, foreignKeys);
      }
    }
  }

  private async dropUniqueConstraints(
    queryRunner: QueryRunner,
    tableName: string,
    columns: string[],
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      return;
    }

    const uniques = table.uniques.filter((unique) =>
      unique.columnNames.some((columnName) => columns.includes(columnName)),
    );

    for (const unique of uniques) {
      await queryRunner.dropUniqueConstraint(tableName, unique);
    }
  }

}
