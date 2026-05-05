# Backend API

The Backend API is a **NestJS 10** REST API that powers both the HR Admin Dashboard and the Candidate Portal. It handles authentication, candidate management, AI-powered assessments, email notifications, and all business logic.

## Features

- **Authentication & Authorization** — JWT-based auth with Passport, bcrypt password hashing, role-based guards
- **Candidate Pipeline** — Registration, OTP verification, MCQ tests, video screening, scoring, and feedback
- **AI Integration** — AWS Bedrock (Amazon Nova) via LangChain for generating role-specific MCQ questions and analyzing video responses
- **File Management** — AWS S3 uploads with pre-signed URLs for resumes, videos, and branding assets
- **Email System** — Nodemailer + SendGrid with Handlebars HTML templates for automated notifications
- **Multi-tenant Organizations** — Branding, policies, and settings per organization
- **Scheduled Jobs** — Cron-based cleanup for expired links and stale data
- **18 Feature Modules** — Auth, Candidate, Video, Quiz, Users, Mailer, CandidateFeedback, Interviewer, Interview, UserRole, RegistrationLink, Organization, AdminRole, SuperAdmin, Role, Bedrock, and more

## Tech Stack

| Technology      | Purpose                                      |
| --------------- | -------------------------------------------- |
| NestJS 10       | Backend framework                            |
| TypeORM 0.3     | ORM / database access                        |
| PostgreSQL 15   | Relational database                          |
| Passport + JWT  | Authentication                               |
| AWS Bedrock     | AI/LLM (question generation, video analysis) |
| LangChain       | AI orchestration                             |
| AWS S3          | File storage                                 |
| Nodemailer      | Email delivery (SendGrid)                    |
| class-validator | Request validation                           |
| TypeScript 5    | Type safety                                  |

## Prerequisites

- **Node.js** >= 20 (use `nvm use` from the repo root — `.nvmrc` is provided)
- **Yarn** 4.x (`corepack enable && corepack prepare yarn@4.6.0 --activate`)
- **Docker & Docker Compose** (for PostgreSQL)
- **AWS Account** with S3 and Bedrock access (optional for basic local dev)
- **SendGrid Account** for email functionality (optional)

## Installation

This package is part of the **Letshire** Yarn workspace. Install all dependencies from the **repo root** — no need to `cd` into this directory:

```bash
# From the repo root
yarn install
```

## Database Setup

Start PostgreSQL from the **repo root** using the root-level docker-compose:

```bash
# From the repo root
yarn compose:up
```

This starts PostgreSQL 15 on port `5432` with:

- **Database:** `hrSolution`
- **User:** `hrSolutionUser`
- **Password:** `hrSolutionPWD`

These are development defaults — override via `.env` or environment variables in production.

After the database is up, use TypeORM migrations to create or update the schema.

Apply all pending migrations:

```bash
yarn workspace hr-api migration:run
```

Check which migrations have already run:

```bash
yarn workspace hr-api migration:show
```

After future entity changes, generate a new migration with a descriptive name:

```bash
yarn workspace hr-api migration:generate src/migrations/DescriptiveChangeName
```

If you need to roll back the last applied migration:

```bash
yarn workspace hr-api migration:revert
```

Recommended local sequence from the repo root:

```bash
yarn compose:up
yarn workspace hr-api migration:run
yarn dev:api
```

## Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

| Variable                | Description                                                                | Example                      |
| ----------------------- | -------------------------------------------------------------------------- | ---------------------------- |
| `DB_HOST`               | PostgreSQL host                                                            | `localhost`                  |
| `DB_PORT`               | PostgreSQL port                                                            | `5432`                       |
| `DB_USER`               | Database username                                                          | `hrSolutionUser`             |
| `DB_PASS`               | Database password                                                          | `hrSolutionPWD`              |
| `DB_NAME`               | Database name                                                              | `hrSolution`                 |
| `JWT_SECRET`            | JWT signing secret                                                         | `your_jwt_secret_key`        |
| `MAIL_HOST`             | SMTP host                                                                  | `smtp.sendgrid.net`          |
| `MAIL_PORT`             | SMTP port                                                                  | `465`                        |
| `MAIL_USER`             | SMTP username                                                              | `apikey`                     |
| `MAIL_PASS`             | SMTP password / API key                                                    | `SG.xxxx`                    |
| `DEFAULT_EMAIL_ADDRESS` | Sender email address                                                       | `noreply@example.com`        |
| `FRONTEND_DASHBOARD`    | HR Admin Dashboard URL (CORS + emails)                                     | `http://localhost:3000`      |
| `FRONTEND_MOBILE_URL`   | Candidate Portal URL used in generated registration links                  | `http://localhost:5173`      |
| `FRONTEND_MOBILE`       | Candidate Portal URL used by CORS/email flows                              | `http://localhost:5173`      |
| `CORS_EXTRA_ORIGINS`    | Additional allowed CORS origins, comma-separated (production)              | `https://app.yourdomain.com` |
| `AWS_REGION`            | AWS region                                                                 | `ap-south-1`                 |
| `AWS_ACCOUNT_ID`        | AWS account ID                                                             | `123456789012`               |
| `AWS_S3_BUCKET`         | S3 bucket name for file storage                                            | `your-s3-bucket`             |
| `BEDROCK_MODEL_ID`      | AWS Bedrock model ID                                                       | `amazon.nova-pro-v1:0`       |
| `BEDROCK_AWS_REGION`    | AWS region for Bedrock Converse calls                                      | `ap-south-1`                 |
| `AI_URL`                | External AI analysis service URL (optional)                                | `http://localhost:5000`      |
| `SUPER_ADMIN_EMAIL`     | Email for the seeded super admin account                                   | `superadmin@example.com`     |
| `SUPER_ADMIN_PASSWORD`  | Password for the seeded super admin account (**required** to trigger seed) | `your_secure_password`       |
| `DEFAULT_ORG_NAME`      | Fallback organisation name for branding                                    | `HR Platform`                |
| `DEFAULT_LOGO_URL`      | Fallback logo URL                                                          | _(empty)_                    |
| `DEFAULT_ORG_ADDRESS`   | Fallback organisation address                                              | _(empty)_                    |
| `DEFAULT_SUPPORT_EMAIL` | Fallback support email                                                     | _(empty)_                    |
| `DEFAULT_PRIMARY_COLOR` | Fallback brand primary colour (hex)                                        | `#be1d2c`                    |
| `PORT`                  | API listen port (optional; defaults to 4000)                               | `4000`                       |

## Seeding

On every startup, `main.ts` automatically runs two idempotent seeders:

| Seeder             | What it does                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `RoleSeeder`       | Creates the default roles (Admin, HR, Interviewer, etc.) if they don't already exist                  |
| `SuperAdminSeeder` | Creates the super admin user from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` if not already present |

Both seeders are **idempotent** — they skip silently if the data already exists. The `SuperAdminSeeder` is skipped entirely if `SUPER_ADMIN_PASSWORD` is not set in the environment.

> **First deployment checklist:** set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in your `.env` before the first server start so the super admin account is created automatically.

## Usage

### Development

Run from the **repo root**:

```bash
yarn dev:api
```

Or target this workspace directly:

```bash
yarn workspace hr-api dev
```

Starts the server in watch mode at [http://localhost:4000](http://localhost:4000). Automatically restarts on file changes.

### Debug Mode

```bash
yarn workspace hr-api start:debug
```

### Production

```bash
yarn workspace hr-api build
yarn workspace hr-api start:prod
```

### Linting & Formatting

```bash
yarn workspace hr-api lint
yarn workspace hr-api format
```

### Testing

```bash
yarn workspace hr-api test          # Unit tests
yarn workspace hr-api test:watch    # Watch mode
yarn workspace hr-api test:cov      # Coverage report
yarn workspace hr-api test:e2e      # End-to-end tests
```

## Project Structure

```
src/
├── main.ts                 # Application bootstrap (CORS, validation, port 4000)
├── app.module.ts           # Root module (imports all feature modules)
├── app.controller.ts       # Health check endpoint
├── app.service.ts          # Root service
├── app/                    # Feature modules
│   ├── auth/               # Authentication (login, JWT, guards)
│   ├── candidate/          # Candidate CRUD and pipeline
│   ├── video/              # Video upload and analysis
│   ├── quiz/               # MCQ test generation and scoring
│   ├── users/              # User management
│   ├── mailer/             # Email service (SendGrid + Handlebars)
│   ├── candidate-feedback/ # Interviewer feedback
│   ├── interviewer/        # Interviewer management
│   ├── interview/          # Interview scheduling
│   ├── organization/       # Multi-tenant org management
│   ├── registration-link/  # Registration link generation
│   ├── bedrock/            # AWS Bedrock AI integration
│   ├── super-admin/        # Super admin operations
│   └── ...                 # Additional modules
├── common/                 # Shared utilities, guards, decorators
└── templates/              # Handlebars email templates
```

## API

The API runs on port **4000** by default. Key endpoint groups:

| Prefix                | Description                                |
| --------------------- | ------------------------------------------ |
| `/auth`               | Login, token refresh                       |
| `/candidates`         | Candidate CRUD, pipeline operations        |
| `/quiz`               | MCQ generation, submission, scoring        |
| `/video`              | Video upload, pre-signed URLs, AI analysis |
| `/users`              | User management                            |
| `/organizations`      | Organization settings, branding            |
| `/interviews`         | Interview scheduling and feedback          |
| `/registration-links` | Generate candidate registration links      |

## Containerization

Local development ships with a root-level [`docker-compose.yml`](../docker-compose.yml) for PostgreSQL.
Application Dockerfiles are not currently included in this repository.

## Related

- [HR Admin Dashboard](../hr-admin-dashboard/README.md)
- [Candidate Portal](../hr-candidate-portal/README.md)
- [Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
