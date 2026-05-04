import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';

import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import path, { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { RoleSeeder } from './app/role/role.seeder';
import { SuperAdminSeeder } from './app/super-admin/super-admin.seed';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(
    helmet({
      // Allow cross-origin loading of static assets (logos/backgrounds served from
      // the API port while the dashboard runs on a different port).
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          // Allow images from any origin (needed for org logos / bg images)
          imgSrc: ["'self'", 'data:', '*'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );

  const FRONTEND_DASHBOARD_URL =
    configService.get<any>('FRONTEND_DASHBOARD') || process.env.FRONTEND_DASHBOARD;
  const FRONTEND_MOBILE_URL =
    configService.get<any>('FRONTEND_MOBILE') || process.env.FRONTEND_MOBILE;

  //Local URLs
  const FRONTEND_DASHBOARD_LOCAL_URL =
    configService.get<any>('FRONTEND_DASHBOARD_LOCAL') || process.env.FRONTEND_DASHBOARD;
  const FRONTEND_MOBILE_LOCAL_URL =
    configService.get<any>('FRONTEND_MOBILE_LOCAL') || process.env.FRONTEND_DASHBOARD;

  // Additional production origins can be added via CORS_EXTRA_ORIGINS (comma-separated)
  const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // ── Static file routes MUST come before the JSON Content-Type middleware ──
  // Serve static files from the uploads directory (dev mode fallback for candidates docs/videos)
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        }
      },
    }),
  );
  // Serve org logos/backgrounds saved locally in dev mode
  app.use(
    '/org-assets',
    express.static(join(process.cwd(), 'uploads')),
  );
  // Serve documents correctly with proper headers
  app.use(
    '/documents',
    express.static(join(__dirname, '..', 'src', 'app', 'user', 'uploads'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.pdf')) {
          res.setHeader('Content-Type', 'application/pdf');
        }
      },
    }),
  );

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  // Force JSON responses only for non-static API routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isStaticAsset = req.path.startsWith('/org-assets') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/documents');
    if (!isStaticAsset) {
      res.setHeader('Content-Type', 'application/json');
    }
    next();
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );
  
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors({
    origin: [
      FRONTEND_DASHBOARD_URL,
      FRONTEND_MOBILE_URL,
      FRONTEND_DASHBOARD_LOCAL_URL,
      FRONTEND_MOBILE_LOCAL_URL,
      ...extraOrigins,
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders:
      'Content-Type, Authorization, Cookies, Access-Control-Allow-Headers, Access-Control-Allow-Origin',
  });

  const logger = new Logger('Bootstrap');

  // ── Seed: system roles (idempotent) ─────────────────────────────────────
  try {
    const roleResult = await app.get(RoleSeeder).seed();
    logger.log(`RoleSeeder: ${roleResult.message}`);
  } catch (err) {
    logger.error('RoleSeeder failed — check DB connection and migration status', err);
  }

  // ── Seed: super admin (idempotent) ───────────────────────────────────────
  try {
    const adminResult = await app.get(SuperAdminSeeder).seed();
    logger.log(`SuperAdminSeeder: ${adminResult.message}`);
  } catch (err) {
    logger.error('SuperAdminSeeder failed', err);
  }

  await app.listen(process.env.PORT || 4000);
  logger.log(`🚀 Application running on port ${process.env.PORT || 4000}`);
}
bootstrap();
