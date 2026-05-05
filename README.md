# Letshire Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

An open-source, full-stack recruitment management platform that digitizes and automates the end-to-end hiring pipeline — from candidate registration through AI-assisted screening to final hiring decisions.

## Why This Exists

Traditional hiring workflows suffer from manual screening bottlenecks, inconsistent evaluations, lack of data-driven decisions, and poor candidate experience. This platform addresses all of these with:

- **AI-generated MCQ assessments** per job role (via AWS Bedrock / Amazon Nova)
- **AI-powered video screening** with emotion, fluency, and tone analysis
- **Role-based dashboards** for super admins, organization admins, HR staff, and interviewers
- **Automated email notifications** at every pipeline stage
- **Multi-tenant branding** — each organization gets its own logos, colors, and policies
- **Anti-cheating enforcement** on the candidate-facing mobile app

## Architecture

The system is composed of **three independently deployable applications** sharing a single PostgreSQL database:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        INTERNET / USERS                              │
└──────┬──────────────────────┬────────────────────────┬───────────────┘
       │                      │                        │
       ▼                      ▼                        ▼
┌──────────────┐   ┌───────────────────┐   ┌──────────────────────┐
│  HR Admin    │   │  Candidate Portal │   │   NestJS Backend     │
│  Dashboard   │   │  (Mobile PWA)     │   │   REST API           │
│  (Next.js)   │   │  (Vite + React)   │   │   Port 4000          │
│  Port 3000   │   │  Port 5173        │   │                      │
└──────────────┘   └───────────────────┘   └──────────────────────┘
       │                      │                        │
       └──────────────────────┴────────────────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │   PostgreSQL     │
                                              │   AWS S3         │
                                              │   AWS Bedrock    │
                                              └─────────────────┘
```

| Application            | Directory              | Framework                        | Port | Audience                    |
| ---------------------- | ---------------------- | -------------------------------- | ---- | --------------------------- |
| **HR Admin Dashboard** | `hr-admin-dashboard/`  | Next.js 15 + Tailwind CSS        | 3000 | Internal HR team (desktop)  |
| **Candidate Portal**   | `hr-candidate-portal/` | Vite + React 18 + MUI            | 5173 | Job candidates (mobile PWA) |
| **Backend API**        | `hr-api/`              | NestJS 10 + TypeORM + PostgreSQL | 4000 | Serves both frontends       |

## Prerequisites

- **Node.js** >= 20 (use `nvm use` — a `.nvmrc` is provided)
- **Yarn** 4.x (`corepack enable && corepack prepare yarn@4.6.0 --activate`)
- **Docker & Docker Compose** (for PostgreSQL)
- **AWS Account** (for S3 and Bedrock AI features — optional for basic local dev)

## Quick Start

Steps marked with `*` are part of the recommended setup flow. Commands marked optional are alternatives you can use when you only need part of the stack.

### 1. Clone the repository *

```bash
git clone https://github.com/DigitalExplorers/LetsHire.git
cd LetsHire
```

### 2. Install all dependencies *

A single install from the root covers all three services — no need to `cd` into each one:

```bash
yarn install
```

### 3. Configure environment variables *

Each service has its own `.env.example`:

```bash
cp hr-api/.env.example hr-api/.env
cp hr-admin-dashboard/.env.example hr-admin-dashboard/.env
cp hr-candidate-portal/.env.example hr-candidate-portal/.env
```

Edit each `.env` with your configuration. At minimum set `JWT_SECRET` in both `hr-api` and `hr-admin-dashboard` (must be the same value).

### 4. Start PostgreSQL *

```bash
yarn compose:up
```

This starts a PostgreSQL 15 instance on port `5432` with default dev credentials.

### 5. Run Database Migrations *

The migration files are **committed to the repository** — you never need to generate them from scratch.
Just apply them against your freshly started PostgreSQL instance:

```bash
yarn workspace hr-api migration:run
```

This creates all tables and relationships defined by the current schema. It also applies later schema changes.
On startup, the API server also automatically seeds the database with:
- **System roles** — `superadmin`, `admin`, `hr`, `interviewer`
- **Super Admin user** — credentials from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` in `hr-api/.env`

### 6. Start the services *

Run all three services in parallel from the root:

```bash
yarn dev
```

Otherwise start services individually if you only need one app:

```bash
yarn dev:api      # Backend API     → http://localhost:4000
yarn dev:admin    # Admin Dashboard → http://localhost:3000
yarn dev:portal   # Candidate Portal → http://localhost:5173
```

## Workspace Commands (optional)

This is a **Yarn 4 monorepo** with three workspaces. All commands run from the root:

| Command                                           | Description                                 |
| ------------------------------------------------- | ------------------------------------------- |
| `yarn dev`                                        | Start all services in parallel (watch mode) |
| `yarn dev:api`                                    | Start Backend API only                      |
| `yarn dev:admin`                                  | Start HR Admin Dashboard only               |
| `yarn dev:portal`                                 | Start Candidate Portal only                 |
| `yarn build`                                      | Build all services                          |
| `yarn build:api` / `build:admin` / `build:portal` | Build individual service                    |
| `yarn start`                                      | Start all in production mode                |
| `yarn lint`                                       | Lint all workspaces                         |
| `yarn test`                                       | Run available workspace tests (currently `hr-api`) |
| `yarn format`                                     | Run Prettier across the entire repo         |
| `yarn compose:up`                                      | Start PostgreSQL                            |
| `yarn compose:down`                                    | Stop PostgreSQL                             |
| `yarn workspace hr-api migration:run`             | Apply all pending DB migrations             |
| `yarn workspace hr-api migration:revert`          | Undo the last applied migration             |
| `yarn workspace hr-api migration:show`            | List migrations and their applied status    |
| `yarn workspace hr-api migration:generate src/migrations/<Name>` | Generate a new migration after changing an entity |


You can also target a workspace directly:

```bash
yarn workspace hr-api test
yarn workspace hr-admin-dashboard lint
```

## Project Structure

```
LetsHire/
├── docker-compose.yml           # PostgreSQL for local development
├── package.json                 # Root — workspace scripts and devDependencies
├── tsconfig.base.json           # Shared TypeScript compiler options
├── .prettierrc                  # Shared Prettier config
├── .editorconfig                # Shared editor config
├── .nvmrc                       # Node.js version pin (20.17.0)
├── README.md                    # This file
├── SECURITY.md                  # Security policy
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Contribution guidelines
├── hr-admin-dashboard/          # HR Admin Dashboard (Next.js 15)
├── hr-api/                      # Backend API (NestJS 10)
└── hr-candidate-portal/         # Candidate Portal (Vite + React 18)
```

Each service has its own README with detailed setup instructions:

- [HR Admin Dashboard — README](hr-admin-dashboard/README.md)
- [Backend API — README](hr-api/README.md)
- [Candidate Portal — README](hr-candidate-portal/README.md)

## Tech Stack

| Layer                  | Technology                                     |
| ---------------------- | ---------------------------------------------- |
| **Admin Frontend**     | Next.js 15, React 19, Tailwind CSS, ApexCharts |
| **Candidate Frontend** | React 18, Vite, Material UI, PWA               |
| **Backend**            | NestJS 10, TypeORM, Passport JWT               |
| **Database**           | PostgreSQL 15                                  |
| **AI/ML**              | AWS Bedrock (Amazon Nova), LangChain           |
| **Storage**            | AWS S3 (pre-signed URLs)                       |
| **Email**              | Nodemailer + Handlebars templates              |
| **Infrastructure**     | Docker, AWS ECS Fargate, AWS CDK               |

## License

This project is licensed under the [MIT License](LICENSE).
