import * as path from 'path';

type DatabaseEnvironment = Record<string, string | undefined>;

function getRequiredValue(env: DatabaseEnvironment, key: string): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: "${key}". ` +
        'Check your .env file or environment configuration.',
    );
  }

  return value;
}

function getPort(env: DatabaseEnvironment): number {
  const rawPort = getRequiredValue(env, 'DB_PORT');
  const port = Number.parseInt(rawPort, 10);

  if (Number.isNaN(port)) {
    throw new Error(`DB_PORT must be a valid integer. Received: "${rawPort}"`);
  }

  return port;
}

/**
 * getDatabaseOptions()
 *
 * Single source of truth for TypeORM connection settings.
 * Used by both:
 *   1. app.module.ts  — NestJS runtime (via TypeOrmModule.forRootAsync)
 *   2. data-source.ts — TypeORM CLI (migration:generate / migration:run)
 *
 * NEVER set synchronize: true here. Schema changes go through migrations only.
 */
export function getDatabaseOptions(env: DatabaseEnvironment) {
  return {
    type: 'postgres' as const,
    host: getRequiredValue(env, 'DB_HOST'),
    port: getPort(env),
    username: getRequiredValue(env, 'POSTGRES_USER'),
    password: getRequiredValue(env, 'POSTGRES_PASSWORD'),
    database: getRequiredValue(env, 'POSTGRES_DB'),

    synchronize: false,

    migrations: [path.join(__dirname, '..', 'migrations', '*.{ts,js}')],
    
    migrationsTableName: 'typeorm_migrations',
  };
}
