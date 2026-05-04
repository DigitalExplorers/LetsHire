# Candidate Portal

The Candidate Portal is a **Vite + React 18** progressive web app (PWA) designed for job candidates on mobile devices. It guides candidates through the full screening journey — from registration and OTP verification through MCQ assessments and video interviews.

## Features

- **Progressive Web App (PWA)** — Installable on mobile devices with offline support
- **11-step candidate journey** — Registration → OTP → Test Begin → MCQ Quiz → Video Screening → Score Board → Thank You
- **MCQ assessments** — Timed, AI-generated multiple-choice tests per job role
- **Video recording** — In-browser video capture for screening questions
- **Anti-cheating enforcement** — Tab-switch detection, full-screen lock, protected exam window
- **OTP verification** — Email-based one-time password authentication
- **Responsive mobile-first design** — Optimized for portrait orientation on phones

## Tech Stack

| Technology      | Purpose                                |
| --------------- | -------------------------------------- |
| React 18        | UI library                             |
| Vite 6          | Build tool and dev server              |
| React Router 7  | Client-side routing                    |
| Material UI 6   | Component library                      |
| Emotion         | CSS-in-JS styling                      |
| Axios           | HTTP client                            |
| TypeScript 5    | Type safety                            |
| vite-plugin-pwa | PWA support (service worker, manifest) |

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

| Variable       | Description          | Example                 |
| -------------- | -------------------- | ----------------------- |
| `VITE_API_URL` | Backend API base URL | `http://localhost:4000` |
| `VITE_APP_URL` | Public app URL used in canonical and social meta tags | `http://localhost:5173` |

## Usage

### Development

Run from the **repo root**:

```bash
yarn dev:portal
```

Or target this workspace directly:

```bash
yarn workspace hr-candidate-portal dev
```

Opens at [http://localhost:5173](http://localhost:5173). Best viewed in a mobile viewport (or Chrome DevTools device emulation).

### Production Build

```bash
yarn workspace hr-candidate-portal build
yarn workspace hr-candidate-portal start   # Preview the production build
```

### Linting

```bash
yarn workspace hr-candidate-portal lint
```

## Project Structure

```
src/
├── main.tsx               # React entry point
├── App.tsx                # Router setup (11-step candidate journey)
├── components/            # UI components
│   ├── auth/              # Registration, OTP verification
│   ├── quiz/              # MCQ test interface
│   ├── video/             # Video recording and playback
│   ├── common/            # Shared components (buttons, loaders, etc.)
│   └── layout/            # Page layout wrappers
├── contexts/              # React context providers (auth, theme)
├── hooks/                 # Custom React hooks
├── styles/                # Global styles
├── theme/                 # MUI theme configuration
└── assets/                # Static assets (icons, images)
public/
├── manifest.json          # PWA manifest
├── icons/                 # PWA icons (multiple sizes)
├── assets/                # Public static assets
└── fonts/                 # Web fonts
```

## Candidate Journey Flow

```
Registration → OTP Verification → Test Instructions → MCQ Quiz
    → Video Screening Setup → Video Questions → Video Recording
    → Score Board → Thank You
```

All routes are protected with the `ProtectedExamWindow` component which enforces:

- Full-screen mode during tests
- Tab-switch detection
- Navigation prevention during active assessments

## Containerization

Application Dockerfiles are not currently included in this repository.

## Related

- [Backend API](../hr-api/README.md)
- [HR Admin Dashboard](../hr-admin-dashboard/README.md)
- [Technical Documentation](../TECHNICAL_DOCUMENTATION.md)
