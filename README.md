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
- **AWS Account** — optional for basic local dev, required for file uploads (S3) and AI quiz/video features (Bedrock). See [AWS Setup](#aws-setup-s3--bedrock). You do **not** put AWS keys in `.env`; credentials come from your AWS CLI profile locally and from an IAM role when deployed.
- **AWS CLI v2** — only if you plan to use the AWS features locally (`aws configure` / `aws sso login`)

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

All three services share a **single `.env` file at the monorepo root**. Copy the example and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and update the values. At a minimum you must set:

| Variable | Why it matters |
| --- | --- |
| `JWT_SECRET` | Signs all auth tokens — **must be the same secret across all services** |
| `POSTGRES_USER` | PostgreSQL username. **Must match `docker-compose.yml`** — it has no built-in defaults, so the DB container won't start if this is unset |
| `POSTGRES_PASSWORD` | PostgreSQL password (same matching rule as above) |
| `POSTGRES_DB` | PostgreSQL database name (same matching rule as above) |
| `DB_HOST` / `DB_PORT` | Where the API reaches Postgres — defaults to `localhost` / `5432` for local Docker |
| `SUPER_ADMIN_EMAIL` | Email address for the first super admin login |
| `SUPER_ADMIN_PASSWORD` | Password for the first super admin login |

The `AWS_*` and `BEDROCK_*` variables are optional for basic local development — see [AWS Setup (S3 + Bedrock)](#aws-setup-s3--bedrock) below. Without them, AI quiz generation is disabled and file uploads fall back to local disk.

> **The same `POSTGRES_*` values are read by two things:** the Docker Postgres container (when it *first* initializes its data volume) and the API (to connect). They must agree. If you change `POSTGRES_PASSWORD` after the volume already exists, Postgres ignores the new value — see [Troubleshooting](#troubleshooting).

> **Super Admin first login:** The API automatically creates a super admin account on first startup using `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from your `.env`. Set these before starting the API, then use those same credentials to log in to the Super Admin dashboard. If these variables are missing, the seed is skipped and no super admin account will exist.

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

> If you get `password authentication failed for user ...` here, your Postgres
> data volume was created with a different password than your current `.env`.
> For a clean local reset (this **deletes local DB data**):
>
> ```bash
> yarn compose:down && docker volume rm letshire_postgres_data
> yarn compose:up
> yarn workspace hr-api migration:run
> ```
>
> See [Troubleshooting](#troubleshooting) for why this happens.

This creates all tables and relationships defined by the current schema. It also applies later schema changes.
On startup, the API server also automatically seeds the database with:
- **System roles** — `superadmin`, `admin`, `hr`, `interviewer`
- **Super Admin user** — credentials from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` in the root `.env`

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
For platform understanding, refer this [Usage Guide](USAGE_GUIDE.md)

## AWS Setup (S3 + Bedrock)

The backend uses two AWS services: **S3** for file storage (resumes, ID proofs, videos, org logos) and **Bedrock** for AI quiz/topic generation. This section is the part most people get stuck on, so read it carefully.

> **Is AWS required?** No, not for a first run. The app starts without it:
> - **File uploads** fall back to the local `hr-api/uploads/` folder when S3 is unavailable.
> - **AI quiz generation** is the only feature that hard-requires Bedrock; it will error without it.
>
> Configure AWS when you want uploads to persist in the cloud or want the AI features.

### How credentials are resolved (important)

**You never put `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in `.env`.** The AWS SDK uses its **default credential provider chain**, which resolves automatically:

| Environment | How credentials are provided |
| --- | --- |
| **Local development** | Your AWS CLI profile — `~/.aws/credentials` (`aws configure`) or SSO (`aws sso login`). Run the API with `AWS_PROFILE=<name>` if it isn't your `default` profile. |
| **Deployed (EC2/ECS/EKS)** | An **IAM role** attached to the compute (instance profile / ECS task role / EKS IRSA). No keys anywhere. |

This is intentional and the AWS-recommended approach — long-lived static keys are avoided entirely. If you *do* set the two key variables in the environment, they override the role, which defeats the secure setup.

> **Account check (saves hours of confusion):** the identity your app authenticates as must belong to — or be granted access to — the **same AWS account that owns your S3 bucket and has Bedrock enabled**. Verify which account/identity is actually in use:
>
> ```bash
> aws sts get-caller-identity     # run in the same shell that starts hr-api
> ```
>
> If this prints a different account than the one that owns `AWS_S3_BUCKET`, uploads will silently fall back to local disk (cross-account `AccessDenied`). Point the app at the right account with `AWS_PROFILE`.

### S3 setup

1. Create (or pick) an S3 bucket **in the same region as `AWS_REGION`** (e.g. `ap-south-1`). A bucket in another region causes upload failures.
2. Set it in `.env`:
   ```dotenv
   AWS_REGION=ap-south-1
   AWS_S3_BUCKET=your-bucket-name
   ```
3. Grant your IAM identity (local user/SSO role, and the deployed role) permission to the bucket:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "LetsHireS3ReadWrite",
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```
   Files are served back to the browser via **pre-signed URLs**, so the bucket can stay private (no public-read needed).

### Bedrock setup

Bedrock powers AI MCQ/topic generation. Two requirements people miss:

1. **Enable model access.** In the Bedrock console (in your region), open **Model access** and enable the model you intend to use (e.g. **Amazon Nova Pro**).
2. **Use an inference-profile ID, not the bare model ID.** Newer models (Amazon Nova included) cannot be invoked on-demand by their plain model ID — you must use a **cross-region inference profile** whose ID is region-prefixed:

   | Region group | `BEDROCK_MODEL_ID` example |
   | --- | --- |
   | Asia Pacific (e.g. `ap-south-1`) | `apac.amazon.nova-pro-v1:0` |
   | US (e.g. `us-east-1`) | `us.amazon.nova-pro-v1:0` |
   | EU (e.g. `eu-west-1`) | `eu.amazon.nova-pro-v1:0` |

   Using the bare `amazon.nova-pro-v1:0` produces: *"Invocation of model ID … with on-demand throughput isn't supported. Retry … with an inference profile."*

   ```dotenv
   BEDROCK_MODEL_ID=apac.amazon.nova-pro-v1:0
   BEDROCK_AWS_REGION=ap-south-1
   ```
3. Grant the IAM identity `bedrock:InvokeModel` (and `bedrock:InvokeModelWithResponseStream`) on the model/inference-profile ARNs.

> Changes to `BEDROCK_MODEL_ID` (or any `.env` value) require **restarting `hr-api`** to take effect. IAM permission changes do **not** need a restart.

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
├── .env.example                 # ← Root env template (copy to .env and fill in values)
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

## Troubleshooting

### `password authentication failed for user "..."` when running migrations or starting the API

Postgres only applies `POSTGRES_PASSWORD` the **first time** it initializes a data volume. If the `letshire_postgres_data` volume already exists from an earlier run, a changed password in `.env`/`docker-compose.yml` is **ignored**, and the stored password no longer matches what the API sends.

A quick in-container `psql` check can be misleading here — the official image trusts local/loopback connections, so it "works" inside the container while the app's external connection (which verifies the password) fails.

**Fix (local dev — deletes DB data):**
```bash
yarn compose:down && docker volume rm letshire_postgres_data
yarn compose:up
yarn workspace hr-api migration:run
```
**Fix (keep data):** reset the role's password to match `.env` without dropping the volume:
```bash
docker exec HR-DATABASE psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "ALTER USER \"$POSTGRES_USER\" WITH PASSWORD '<value from .env>';"
```

### The database container won't start

`docker-compose.yml` reads `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` with **no defaults**. If they're unset in `.env`, the container fails to start. Make sure all three are set.

### Port 5432 is already in use

Another Postgres (a different project's container, or a local install) is holding the port. Stop it, or change the host port mapping in `docker-compose.yml`. If a *different* Postgres answers on 5432, you'll see the auth error above even though your config is correct.

### Bedrock: "Invocation of model ID … with on-demand throughput isn't supported"

You're passing a bare model ID. Use a region-prefixed **inference profile** in `BEDROCK_MODEL_ID` (e.g. `apac.amazon.nova-pro-v1:0`) and restart `hr-api`. See [Bedrock setup](#bedrock-setup).

### Bedrock: `AccessDeniedException`

The model isn't enabled for your account/region, or your IAM identity lacks `bedrock:InvokeModel`. Enable it under **Model access** in the Bedrock console and check the IAM policy.

### File uploads end up in `hr-api/uploads/` instead of S3

The S3 upload failed and the code fell back to local disk. Check the API log line:
```
S3 upload failed, falling back to local filesystem: <reason>
```
Common reasons and fixes:
- **`AccessDenied`** → your IAM identity lacks `s3:PutObject`, **or** it belongs to a different AWS account than the bucket. Run `aws sts get-caller-identity` in the API's shell and confirm the account owns `AWS_S3_BUCKET`; fix with the right `AWS_PROFILE` and/or the [S3 policy](#s3-setup).
- **`PermanentRedirect` / region errors** → the bucket is in a different region than `AWS_REGION`. Set `AWS_REGION` to the bucket's region.
- **`NoSuchBucket`** → `AWS_S3_BUCKET` is wrong or doesn't exist.

## License

This project is licensed under the [MIT License](LICENSE).
