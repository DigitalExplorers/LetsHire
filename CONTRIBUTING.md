# Contributing to AI-Enabled HR Solution

Thank you for your interest in contributing! This guide will help you get started.

Please review [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before participating in this project.

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **Yarn** 4.x (enable via `corepack enable`)
- **Docker & Docker Compose** (for PostgreSQL)
- **Git**

### Local Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/DigitalExplorers/LetsHire.git
   cd LetsHire
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Configure environment files**

   ```bash
   cp hr-api/.env.example hr-api/.env
   cp hr-admin-dashboard/.env.example hr-admin-dashboard/.env
   cp hr-candidate-portal/.env.example hr-candidate-portal/.env
   ```

4. **Start the database**

   ```bash
   yarn compose:up
   ```

5. **Run database migrations**

   ```bash
   yarn workspace hr-api migration:run
   ```

6. **Start the applications**

   ```bash
   yarn dev:api
   yarn dev:admin
   yarn dev:portal
   ```

### Services

| Service          | URL                   |
| ---------------- | --------------------- |
| Backend API      | http://localhost:4000 |
| Admin Dashboard  | http://localhost:3000 |
| Candidate Portal | http://localhost:5173 |

## How to Contribute

### Reporting Bugs

- Open an [issue](https://github.com/DigitalExplorers/LetsHire/issues/new) with a clear title and description
- Include steps to reproduce, expected vs actual behavior
- Add screenshots if applicable

### Suggesting Features

- Open an issue with the `enhancement` label
- Describe the use case and proposed solution

### Submitting Code Changes

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** — keep commits focused and well-described

3. **Lint your code** before committing:

   ```bash
   yarn lint
   ```

4. **Commit** with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/):

   ```
   feat: add candidate export to CSV
   fix: correct OTP expiration check
   docs: update API endpoint documentation
   chore: update dependencies
   ```

5. **Push** your branch and open a Pull Request against `main`

### Pull Request Guidelines

- Reference any related issues (e.g., `Fixes #42`)
- Describe what changed and why
- Keep PRs focused — one feature or fix per PR
- Ensure linting passes

## Project Structure

```
LetsHire/
├── hr-admin-dashboard/   # Next.js 15 — HR Admin interface (port 3000)
├── hr-api/               # NestJS 10 — Backend REST API (port 4000)
└── hr-candidate-portal/  # Vite + React 18 — Candidate PWA (port 5173)
```

## Branch Naming

| Prefix      | Use for                   |
| ----------- | ------------------------- |
| `feat/`     | New features              |
| `fix/`      | Bug fixes                 |
| `docs/`     | Documentation changes     |
| `chore/`    | Maintenance, dependencies |
| `refactor/` | Code refactoring          |

## Code Style

- **TypeScript** across all projects
- **ESLint** for linting — run `yarn lint` from the repo root
- **Prettier** for formatting — run `yarn format` from the repo root

## Need Help?

- Open an issue for questions, bug reports, or feature requests
- For sensitive reports, follow [SECURITY.md](./SECURITY.md)
