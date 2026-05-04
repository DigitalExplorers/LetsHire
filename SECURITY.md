# Security Policy

## Supported Versions

We actively maintain and patch security issues in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |

Older branches or forks are not actively maintained. Please always use the latest commit on `main`.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it privately so we can address it before it is disclosed publicly. Send your report by email to the repository maintainers or open a [GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/creating-a-repository-security-advisory) on this repository.

### What to include in your report

- A clear description of the vulnerability
- Steps to reproduce (proof of concept if possible)
- The potential impact (what data or systems could be affected)
- Any suggested remediation if you have one

### What to expect

- **Acknowledgement** within 72 hours of your report
- **Status update** within 7 days (confirmed, in progress, or not reproducible)
- **Patch or mitigation** released as soon as reasonably possible depending on severity
- **Credit** in the changelog or release notes if you wish (we will ask before publishing your name)

We ask that you:

- Give us reasonable time to address the issue before any public disclosure
- Avoid accessing, modifying, or deleting data that does not belong to you
- Do not perform denial-of-service attacks or disrupt service availability

## Scope

The following are **in scope** for security reports:

- Authentication and authorization flaws (JWT handling, RBAC bypasses)
- Injection vulnerabilities (SQL injection, command injection, XSS)
- Sensitive data exposure (credentials, PII, tokens)
- Insecure direct object references
- Server-side request forgery (SSRF)
- Broken access control
- Dependency vulnerabilities with a known exploit path

The following are **out of scope**:

- Vulnerabilities in third-party services (AWS, SendGrid, etc.)
- Theoretical vulnerabilities without a working proof of concept
- Issues only exploitable by a local attacker with physical access
- Denial-of-service attacks without a significant security impact

## Known Security Considerations

- TypeORM schema management should use migrations only. Keep `synchronize: false` in every environment and apply schema changes with reviewed migrations.
- The seeder (`super-admin.seed.ts`) should only be run on first deployment with a strong password set via `SUPER_ADMIN_PASSWORD`.
- `JWT_SECRET` must be a long, random secret in production. Never use the default or a weak value.

## Thank You

We appreciate the responsible disclosure of security vulnerabilities. Security researchers who report valid issues will be acknowledged in our release notes (with their permission).
