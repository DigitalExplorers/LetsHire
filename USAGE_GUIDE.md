# Letshire — Platform Usage Guide

A comprehensive guide on how to use the Letshire recruitment management platform, covering every role, feature, and workflow from initial setup to candidate hiring.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Roles & Access Levels](#roles--access-levels)
3. [Getting Started — First Login](#getting-started--first-login)
4. [Super Admin Dashboard](#super-admin-dashboard)
5. [Organization Admin Dashboard](#organization-admin-dashboard)
6. [HR Dashboard](#hr-dashboard)
7. [Interviewer Dashboard](#interviewer-dashboard)
8. [Candidate Portal (Mobile PWA)](#candidate-portal-mobile-pwa)
9. [Registration Link & QR Code System](#registration-link--qr-code-system)
10. [Quiz & Assessment System](#quiz--assessment-system)
11. [Video Screening](#video-screening)
12. [Interview & Feedback Flow](#interview--feedback-flow)
13. [Email Notifications](#email-notifications)

---

## Platform Overview

Letshire is composed of **three applications** that work together:

| Application | URL | Audience | Purpose |
| --- | --- | --- | --- |
| **HR Admin Dashboard** | `http://localhost:3000` | Internal staff (Super Admin, Admin, HR, Interviewer) | Manage organizations, positions, candidates, interviews, and assessments |
| **Candidate Portal** | `http://localhost:5173` | Job candidates (mobile) | Self-service registration, MCQ tests, and video screening |
| **Backend API** | `http://localhost:4000` | Both frontends | REST API powering all business logic, authentication, and data |

All three services share a **single `.env` file at the monorepo root** for configuration.

---

## Roles & Access Levels

The platform uses a hierarchical role-based access control (RBAC) system with **four roles**. These roles are automatically seeded into the database on first startup.

| Role | Display Name | Scope | Created By |
| --- | --- | --- | --- |
| `superadmin` | Super Admin | Platform-wide | Seeded from `.env` on first startup |
| `admin` | Admin | Single organization | Super Admin |
| `hr` | Human Resources | Single organization | Admin |
| `interviewer` | Interviewer | Single organization | Admin |

### Role Hierarchy

```
Super Admin (platform owner)
  └── Admin (organization owner)
        ├── HR (manages candidates and positions)
        └── Interviewer (conducts interviews, gives feedback)
```

> **Key distinction:** The Super Admin manages the entire platform (multiple organizations). The Admin manages their own organization's hiring pipeline. HR and Interviewer are support roles created by the Admin.

---

## Getting Started — First Login

### Prerequisites

1. Clone the repo, install dependencies, and create your `.env`:
   ```bash
   git clone https://github.com/DigitalExplorers/LetsHire.git
   cd LetsHire
   yarn install
   cp .env.example .env
   ```

2. **Edit the `.env` file** and set at minimum:
   ```env
   DB_PASS=your_database_password
   JWT_SECRET=your_jwt_secret_key
   SUPER_ADMIN_EMAIL=superadmin@example.com
   SUPER_ADMIN_PASSWORD=your_secure_password
   ```

3. Start the database and run migrations:
   ```bash
   yarn compose:up
   yarn workspace hr-api migration:run
   ```

4. Start all services:
   ```bash
   yarn dev
   ```

### Super Admin First Login

> **Important:** The `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` values you set in the root `.env` file are the credentials used to create the Super Admin account. The API automatically seeds this account on first startup. **Use these exact credentials to log in.**

1. Open the HR Admin Dashboard at **http://localhost:3000**
2. You will be redirected to the sign-in page
3. Enter:
   - **Email:** The value of `SUPER_ADMIN_EMAIL` from your `.env` (e.g., `superadmin@example.com`)
   - **Password:** The value of `SUPER_ADMIN_PASSWORD` from your `.env`
4. Click **Sign In** — you will land on the Super Admin Dashboard

> If the Super Admin account was not created (check API startup logs for `SuperAdminSeeder`), ensure that both `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are set in your `.env`, then restart the API.

---

## Super Admin Dashboard

The Super Admin has **platform-wide control**. After logging in, you have access to:

### Dashboard
- Overview of all organizations and admins on the platform

### Organizations Management
**Navigate to:** Super Admin → Organizations

| Action | Description |
| --- | --- |
| **View All Organizations** | List of all organizations registered on the platform |
| **Add Organization** | Create a new organization with name, description, website, contact info, and branding (logo, background image, primary color) |
| **Edit Organization** | Update an organization's details, branding, and contact information |
| **Upload Logo** | Upload a logo image for the organization (stored in S3) |
| **Upload Background** | Upload a background image for branding |

### Admins Management
**Navigate to:** Super Admin → Admins

| Action | Description |
| --- | --- |
| **View All Admins** | List of all organization admins across the platform |
| **Add Admin** | Create a new admin user and assign them to an organization |
| **Edit Admin** | Update an admin's name, email, or organization assignment |
| **Delete Admin** | Remove an admin user |

### Typical Super Admin Workflow

```
1. Log in as Super Admin
2. Create an Organization (name, branding, contact info)
3. Create an Admin user and assign them to that Organization
4. The Admin can now log in and manage their organization's hiring
```

---

## Organization Admin Dashboard

The Admin manages **their organization's entire hiring operation**. After the Super Admin creates an Admin account, the Admin logs in with their credentials at `http://localhost:3000`.

### Dashboard
- Analytics and statistics for their organization's hiring pipeline
- Charts showing candidate counts, hiring rates, and pipeline stages

### Team Management
**Navigate to:** Admin → Team

| Action | Description |
| --- | --- |
| **View Team Members** | List of all HR staff and Interviewers in the organization |
| **Add Team Member** | Create a new user with role `hr` or `interviewer` within the organization |
| **Edit Team Member** | Update a team member's details |
| **Delete Team Member** | Remove a team member |

### Positions (Job Roles)
**Navigate to:** Positions

| Action | Description |
| --- | --- |
| **View All Positions** | List of all job positions/roles created by the organization |
| **Add Position** | Create a new position (e.g., "Software Engineer", "Data Analyst") with experience requirements |
| **Edit Position** | Update position details |
| **Delete Position** | Remove a position |

### Questions & Assessments
**Navigate to:** Positions → Questions

| Action | Description |
| --- | --- |
| **View Questions** | View MCQ questions assigned to a specific position |
| **Add Question Manually** | Create a new MCQ question with multiple options (mark one as correct) |
| **Bulk Upload Questions** | Upload questions from a CSV/XLSX file |
| **AI-Generate Questions** | Use AWS Bedrock (Amazon Nova) to automatically generate role-specific MCQ questions |
| **Configure Quiz** | Set the number of questions per test and time limit per question for each position |

### Registration Links & QR Codes
**Navigate to:** Generate URL

| Action | Description |
| --- | --- |
| **Generate Registration Link** | Create a unique registration link for a specific position with an exam time window (start/end time) |
| **View All Generated URLs** | See all registration links created, with their status and expiry |
| **QR Code** | Each link generates a QR code that candidates can scan on their mobile devices |

### Candidates
**Navigate to:** Candidates

| Action | Description |
| --- | --- |
| **View All Candidates** | List of all candidates who registered through the portal, with their current status |
| **View Candidate Details** | See a candidate's full profile: personal info, resume, ID proof, quiz scores, video recordings, and interview history |
| **Update Status** | Change a candidate's pipeline status (e.g., Registered → Shortlisted → Hired / Rejected) |
| **Download Documents** | View or download a candidate's resume and ID proof (via pre-signed S3 URLs) |
| **Watch Video** | View a candidate's screening video recording |

### Interviews
**Navigate to:** Interview

| Action | Description |
| --- | --- |
| **View All Interviews** | List of all scheduled interviews |
| **Add Interviewer** | Create and manage interviewers |
| **Assign Interviewer** | Assign an interviewer to a specific candidate |
| **Schedule Interview** | Set a date and time for a candidate's interview |
| **View Assigned Candidates** | See which candidates are assigned to each interviewer |
| **Shortlist Candidates** | View candidates that passed screening and are ready for interviews |
| **View Interview Feedback** | See feedback and scores submitted by interviewers |
| **View Interview History** | Full history of all interview rounds for each candidate |
| **Hired Candidates** | View candidates who have been hired |
| **Rejected Candidates** | View candidates who have been rejected |

---

## HR Dashboard

HR staff are created by the Organization Admin. They log in at `http://localhost:3000` with their assigned credentials.

### Dashboard
- Overview of the hiring pipeline for their organization

### Key Actions

| Action | Description |
| --- | --- |
| **View Candidates** | Access the candidate list and track pipeline stages |
| **View Candidate Details** | See profiles, quiz scores, videos, and documents |
| **Manage Positions** | Create and edit job positions |
| **Configure Assessments** | Set up MCQ questions and quiz parameters |
| **Generate Registration Links** | Create links and QR codes for candidate registration |
| **Schedule Interviews** | Assign interviewers and set interview dates |

> HR has similar access to the Admin for day-to-day hiring operations, but **cannot manage team members** or organization-level settings.

---

## Interviewer Dashboard

Interviewers are created by the Organization Admin. They log in at `http://localhost:3000` with their assigned credentials.

### Dashboard
- Overview of candidates assigned to them

### Assigned Candidates
**Navigate to:** Interviewer → Assigned

| Action | Description |
| --- | --- |
| **View Assigned Candidates** | See the list of candidates they need to interview |
| **View Candidate Profile** | Access the candidate's full profile, resume, quiz scores, and video |
| **Submit Feedback** | After conducting an interview, submit a feedback form with written notes and a numerical score |
| **View Past Feedback** | Review previously submitted feedback |

### Key Responsibilities
1. Review assigned candidate profiles (resume, quiz scores, video recordings)
2. Conduct interviews (in-person or virtual — managed outside the platform)
3. Submit structured feedback with a score through the platform
4. The Admin/HR reviews the feedback to make hiring decisions

---

## Candidate Portal (Mobile PWA)

The Candidate Portal is a **Progressive Web App** optimized for mobile devices. Candidates access it by scanning a QR code or clicking a registration link shared by the hiring organization.

### How Candidates Access the Portal

1. The Admin/HR generates a **registration link** for a specific position
2. The link/QR code is shared with candidates (via email, poster, job listing, etc.)
3. Candidates open the link on their mobile device at `http://localhost:5173/{token}`

### Candidate Journey (Step by Step)

```
Entry → Registration → OTP → Test Instructions → MCQ Quiz → Video Setup → Video Recording → Score Board → Thank You
```

| Step | Screen | What Happens |
| --- | --- | --- |
| 1 | **Exam Entry** | Candidate opens the link and sees the organization's branding, position details, and exam time window |
| 2 | **Onboarding** | Brief introduction to the hiring process |
| 3 | **Registration** | Candidate fills in personal details (name, email, phone, education, experience) and uploads their **resume** (mandatory) and **ID proof** (optional) |
| 4 | **OTP Verification** | An OTP is sent to the candidate's email. They must enter it to verify their identity |
| 5 | **Test Instructions** | Displays the quiz rules: number of questions, time limit per question, and anti-cheating policies |
| 6 | **MCQ Quiz** | Timed multiple-choice test. Questions are specific to the applied position. Candidates select answers within the time limit |
| 7 | **Video Screening Setup** | Instructions for the video recording round |
| 8 | **Video Recording** | Candidate records a video answering screening questions using their device camera |
| 9 | **Score Board** | Candidate sees their MCQ quiz results |
| 10 | **Thank You** | Confirmation screen. The candidate's application is now complete |

### Anti-Cheating Enforcement

During the quiz and video recording steps, the portal enforces:

- **Full-screen mode** — the test must run in full-screen
- **Tab-switch detection** — switching tabs or apps is detected and recorded
- **Navigation prevention** — browser back/forward buttons are disabled during active assessments
- **Device detection** — the portal is designed for mobile devices only

### Multi-Round Support

If a candidate is **shortlisted** after the first round, they can return using the same link to complete a second round (new MCQ + video). The system tracks which round the candidate is on and prevents completed candidates from re-registering.

---

### Candidate Status Flow

```
Registered → Shortlisted → Interview Scheduled → Interviewed → Hired / Rejected
```

| Status | Meaning |
| --- | --- |
| **Registered** | Candidate has completed registration, quiz, and video |
| **Shortlisted** | Admin/HR has reviewed and marked the candidate for interview |
| **Interview Scheduled** | An interviewer has been assigned and a date set |
| **Interviewed** | The interview has been conducted and feedback submitted |
| **Hired** | Candidate has been selected for the position |
| **Rejected** | Candidate has been rejected at any stage |

---

## Registration Link & QR Code System

Registration links are the bridge between the Admin Dashboard and the Candidate Portal.

### How It Works

1. **Admin/HR** navigates to **Generate URL** in the dashboard
2. Selects a **Position** (e.g., "Software Engineer")
3. Sets an **Exam Time Window** (start date/time and end date/time)
4. Clicks **Generate** — the system creates a unique token-based URL
5. A **QR code** is automatically generated for the link
6. The link is shared with candidates via email, printed posters, or job listings

### Link Structure

```
http://localhost:5173/{unique-token}
```

- Each link is tied to a specific **position**, **admin**, and **organization**
- Links have an **expiry window** — candidates can only register during the specified time
- The candidate portal resolves the token to display the correct organization branding and position details

---

## Quiz & Assessment System

### For Admin/HR (Setup)

1. **Create a Position** (e.g., "Frontend Developer")
2. **Add MCQ Questions** for that position using one of three methods:
   - **Manual entry** — type question + options one by one
   - **Bulk upload** — upload a CSV/XLSX file with questions
   - **AI generation** — use AWS Bedrock to auto-generate role-specific questions
3. **Configure Quiz Parameters:**
   - Number of questions per test
   - Time per question (in seconds)

### For Candidates (Taking the Quiz)

1. After registration and OTP verification, the candidate sees **Test Instructions**
2. The quiz presents the configured number of randomly selected MCQ questions
3. Each question has a **countdown timer**
4. Candidates can select an answer or skip
5. After completing all questions, the quiz score is calculated and saved
6. The candidate sees their score on the **Score Board**

---

## Video Screening

### For Candidates (Recording)

1. After the MCQ quiz, the candidate enters the **Video Screening** section
2. Screening questions are displayed on screen
3. The candidate records a video using their device's front camera
4. The recorded video is uploaded to **AWS S3**
5. The candidate proceeds to the score board and thank-you screen

### For Admin/HR (Reviewing)

1. Navigate to a candidate's profile in the dashboard
2. Click to view the candidate's video recording (served via pre-signed S3 URL)

---

## Interview & Feedback Flow

### Scheduling

1. Admin/HR identifies a shortlisted candidate
2. Assigns an **Interviewer** from the organization's team
3. Sets an **interview date and time**
4. The candidate's status updates to "Interview Scheduled"

### Conducting the Interview

1. The Interviewer logs into the dashboard
2. Views their **Assigned Candidates** list
3. Reviews the candidate's profile, quiz scores, and video before the interview
4. Conducts the interview (in-person or virtual — managed outside the platform)

### Submitting Feedback

1. After the interview, the Interviewer navigates to the feedback form
2. Enters:
   - **Written feedback** — detailed notes about the candidate
   - **Score** — numerical rating
3. Submits the feedback — it becomes visible to Admin/HR

---

## Email Notifications

The platform automatically sends emails at key stages (requires SendGrid SMTP configuration in `.env`):

| Event | Email Sent To | Content |
| --- | --- | --- |
| **OTP Verification** | Candidate | One-time password for identity verification |
| **Registration Confirmation** | Candidate | Confirmation that their application was received |
| **Interview Scheduled** | Candidate & Interviewer | Interview date, time, and details |
| **Status Update** | Candidate | Notification when their status changes (shortlisted, rejected, hired) |

---

## URLs & Ports

| Service | Default URL | Configurable Via |
| --- | --- | --- |
| HR Admin Dashboard | http://localhost:3000 | Next.js defaults |
| Candidate Portal | http://localhost:5173 | `VITE_APP_URL` in `.env` |
| Backend API | http://localhost:4000 | `PORT` in `.env` (default 4000) |
| PostgreSQL | localhost:5432 | `DB_HOST` / `DB_PORT` in `.env` |
