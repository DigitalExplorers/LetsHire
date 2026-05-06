/**
 * data-source.ts — TypeORM CLI adapter
 *
 * ─── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 *
 * The TypeORM CLI (migration:generate, migration:run, migration:revert, etc.)
 * is a plain Node.js script. It needs a raw `DataSource` object to connect
 * to the database and inspect your entity classes.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as path from 'path';
import { getDatabaseOptions } from './config/database.config';

// Load .env manually — the NestJS ConfigModule handles this at app runtime,
// but the CLI runs as a standalone script outside of NestJS.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export const AppDataSource = new DataSource({
  // Reuses the same DB connection settings as app.module.ts.
  ...getDatabaseOptions(process.env),

  // The CLI needs to discover entity classes to compare against the current
  // DB schema when generating migrations.
  entities: [path.join(__dirname, '**', '*.entity.{ts,js}')],

  // Wrap each migration in its own transaction so a failure
  // rolls back cleanly without corrupting completed migrations.
  migrationsTransactionMode: 'each',

  logging: process.env.NODE_ENV !== 'production',
});
