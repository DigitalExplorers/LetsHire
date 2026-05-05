# HR Admin Dashboard

The HR Admin Dashboard is a **Next.js 15** web application that provides role-based management interfaces for the AI-Enabled HR recruitment platform. It serves super admins, organization admins, HR staff, and interviewers.

## Features

- **Role-based access control (RBAC)** — Super Admin, Admin, HR, and Interviewer roles with JWT + middleware-based route protection
- **Organization management** — Multi-tenant support with custom branding (logos, colors, policies)
- **Position & candidate management** — Create positions, track candidates through the hiring pipeline
- **Interview scheduling** — Assign interviewers, manage feedback and scoring
- **AI-powered assessments** — Configure MCQ tests and video screening powered by AWS Bedrock
- **Analytics dashboards** — Hiring pipeline charts and statistics (ApexCharts, Recharts)
- **Email notifications** — Automated candidate communications with QR code–based registration links

## Tech Stack

| Technology            | Purpose                      |
| --------------------- | ---------------------------- |
| Next.js 15            | React framework (App Router) |
| React 19              | UI library                   |
| Tailwind CSS 3        | Styling                      |
| TypeScript 5          | Type safety                  |
| Axios                 | HTTP client                  |
| Jose + JWT            | Authentication               |
| ApexCharts / Recharts | Data visualization           |
| MUI 7                 | Select UI components         |

## Prerequisites

- **Node.js** >= 20 (use `nvm use` from the repo root — `.nvmrc` is provided)
- **Yarn** 4.x (`corepack enable && corepack prepare yarn@4.6.0 --activate`)
- The **Backend API** (`hr-api`) running on port 4000

## Installation

This package is part of the **Letshire** Yarn workspace. Install all dependencies from the **repo root** — no need to `cd` into this directory:

```bash
# From the repo root
yarn install
```

## Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

| Variable              | Description                             | Example                 |
| --------------------- | --------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL                    | `http://localhost:4000` |
| `LOCALHOST_URL`       | Local fallback API URL used by service helpers | `http://localhost:4000` |
| `JWT_SECRET`          | JWT signing secret (must match backend) | `your_jwt_secret_key`   |
| `NODE_ENV`            | Runtime environment                     | `development`           |
| `AWS_REGION`          | AWS region used to build remote image hostnames | `ap-south-1`      |
| `NEXT_PUBLIC_S3_BUCKET_NAME` | S3 bucket name for remote image rendering | `your-bucket-name` |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | Cookie domain for production deployments | `.example.com` |

## Usage

### Development

Run from the **repo root**:

```bash
yarn dev:admin
```

Or target this workspace directly:

```bash
yarn workspace hr-admin-dashboard dev
```

Opens at [http://localhost:3000](http://localhost:3000). The page auto-updates as you edit files.

### Production Build

```bash
yarn workspace hr-admin-dashboard build
yarn workspace hr-admin-dashboard start
```

### Linting

```bash
yarn workspace hr-admin-dashboard lint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Organization admin pages
│   ├── hr/                 # HR staff pages
│   ├── interviewer/        # Interviewer pages
│   ├── super-admin/        # Super admin pages
│   ├── auth/               # Authentication (sign-in)
│   ├── candidates/         # Candidate management
│   ├── positions/          # Position management
│   ├── interview/          # Interview management
│   ├── settings/           # Organization settings
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Entry point (auth redirect)
├── components/             # Reusable UI components
│   ├── Breadcrumbs/        # Navigation breadcrumbs
│   ├── Charts/             # Chart components
│   ├── Dashboard/          # Dashboard widgets
│   ├── Header/             # Top navigation header
│   ├── Layouts/            # Page layout wrappers
│   ├── Panels/             # Side panels
│   ├── Sidebar/            # Navigation sidebar
│   └── Tables/             # Data table components
├── contexts/               # React context providers
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

## Containerization

Application Dockerfiles are not currently included in this repository.

## Related

- [Backend API](../hr-api/README.md)
- [Candidate Portal](../hr-candidate-portal/README.md)
- [Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
