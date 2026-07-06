# AI-Powered Multi-Cloud Portability & Deployment Automation Platform

> Deploy, monitor, optimize, secure, migrate, and manage applications across **AWS, Azure, and GCP** from one unified, AI-assisted control plane.

[![CI](https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app/actions)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![React](https://img.shields.io/badge/react-18.x-blue)

---

## Overview

An enterprise-grade, **free-tier-friendly** cloud management platform built as a modular monolith with a
pluggable **Cloud Provider Adapter** pattern. Every feature runs locally via Docker Compose, and a built-in
**Demo Mode** seeds realistic data so the platform is fully functional with **zero cloud accounts and near-zero cost**.

### Key capabilities (19 modules)

| Area | Modules |
|------|---------|
| **Identity** | JWT Auth + RBAC (Admin, Cloud Engineer, DevOps Engineer, Viewer) |
| **Visibility** | Multi-Cloud Dashboard, Deployment History, Monitoring Center |
| **AI** | AI Cloud Architect, Incident Analyzer, ChatOps Assistant (Amazon Bedrock / Claude) |
| **Portability** | Portability Analyzer, Migration Advisor |
| **Automation** | Terraform Engine, Docker Engine, Kubernetes Management, One-Click Rollback |
| **Security** | Security Center, Adversarial Security Lab, Compliance Checker |
| **FinOps & Green** | FinOps Dashboard, Green Cloud Score |
| **Showcase** | Portfolio Showcase Page |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, React Router, Recharts, PWA |
| Backend | Node.js 20, Express |
| Database | MongoDB Atlas (M0 free tier) / local Mongo |
| Auth | JWT, bcrypt, RBAC |
| Containers | Docker, Docker Compose |
| IaC | Terraform (AWS / Azure / GCP) |
| Orchestration | Kubernetes (EKS / AKS / GKE views) |
| Monitoring | Prometheus, Grafana |
| CI/CD | GitHub Actions |
| AI | Amazon Bedrock (Claude) with mock fallback |

---

## Monorepo Structure

```
Cloud-portaibility-app/
├── backend/              # Node.js + Express API (layered architecture)
├── frontend/             # React PWA (Tailwind + Recharts)
├── infra/
│   ├── terraform/        # IaC modules for AWS / Azure / GCP
│   └── monitoring/       # Prometheus + Grafana provisioning
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # Architecture & phase documentation
├── legacy/               # Original static demo (preserved)
├── docker-compose.yml    # One-command local stack
└── README.md
```

See [`docs/02-folder-structure.md`](docs/02-folder-structure.md) for the full annotated tree.

---

## Quick Start (Demo Mode — near-zero cloud cost)

```bash
# 1. Clone
git clone https://github.com/Pratikshaprabhakarbande/Cloud-portaibility-app.git
cd Cloud-portaibility-app

# 2. Configure environment.
#    JWT_SECRET and JWT_REFRESH_SECRET are REQUIRED — the backend fails fast
#    without them. The .env.example files include dev-only values to get started.
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Launch the full stack
docker compose up --build

# (optional) seed demo data so the dashboard is populated
docker compose exec backend npm run seed
```

| Service | URL |
|---------|-----|
| Frontend (PWA) | http://localhost:3000 |
| Backend API | http://localhost:5000/api/health |
| Metrics (Prometheus exposition) | http://localhost:5000/metrics |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

Demo logins after seeding (local use only): `admin@demo.io / Admin@12345` (also `cloud@`, `devops@`, `viewer@`).

### Local development (without Docker)

```bash
# Backend  (set JWT secrets in backend/.env first)
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

API reference: [`docs/openapi.yaml`](docs/openapi.yaml) · Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md) · Security: [`SECURITY.md`](SECURITY.md)

---

## Configuration

All configuration is environment-based. Copy the provided `.env.example` files and adjust.
**Never commit real `.env` files** — only the `.env.example` templates are tracked.

### Environment variable reference (backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `PORT` | no | `5000` | Backend HTTP port |
| `API_PREFIX` | no | `/api` | Base path for API routes |
| `CORS_ORIGIN` | prod: **yes** | `http://localhost:3000` | Allowed origin; must be explicit (non-`*`) in production |
| `DEMO_MODE` | no | `true` | `true` = mock/DB adapters (no cloud creds) |
| `MONGO_URI` | prod: **yes** | `mongodb://localhost:27017/cloudportability` | MongoDB connection string |
| `JWT_SECRET` | **yes** | — | Access-token signing secret (server fails fast if missing) |
| `JWT_REFRESH_SECRET` | **yes** | — | Refresh-token signing secret (must differ from `JWT_SECRET`) |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` | Access-token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | Refresh-token lifetime |
| `JWT_RESET_EXPIRES_MIN` | no | `15` | Password-reset token lifetime (minutes) |
| `BCRYPT_SALT_ROUNDS` | no | `10` | bcrypt cost factor |
| `RATE_LIMIT_WINDOW_MS` | no | `900000` | Global rate-limit window |
| `RATE_LIMIT_MAX` | no | `100` | Max requests per window |
| `CACHE_ENABLED` | no | `true` (off in tests) | Cloud-adapter result caching |
| `CACHE_TTL_MS` | no | `30000` | Adapter cache TTL |
| `LOG_LEVEL` | no | `info` | Winston log level |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | no | — | Only when `DEMO_MODE=false` |
| `AZURE_*` / `GCP_*` | no | — | Only when `DEMO_MODE=false` |

### Environment variable reference (frontend, Vite)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_APP_NAME` | — | App display name |
| `VITE_DEMO_MODE` | `true` | UI demo flag |

> Generate strong secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## Implementation Status

A **production-grade, fully-containerized multi-cloud management platform.** All
core modules have backend APIs, frontend UIs, tests, and documentation.

| Area | Status |
|------|--------|
| Architecture, folder structure, scaffolding | ✅ Done |
| Database (13 Mongoose models, plugins, repositories, seed) | ✅ Done |
| Authentication & RBAC (JWT rotating refresh, bcrypt, CSRF, HttpOnly cookies) | ✅ Done |
| React frontend (auth, layout, dark mode, PWA, 9 module pages) | ✅ Done |
| Multi-Cloud Dashboard — provider cards, charts, history, provider switching | ✅ Done |
| Cloud Adapter Layer — AWS/Azure/GCP/Mock/Multi-Cloud + live SDK wiring | ✅ Done |
| Terraform Automation — safe simulation + live opt-in + history | ✅ Backend + UI |
| Security Center — risk score, failed logins, events | ✅ Backend + UI |
| AI Cloud Advisor — rule-based engine (LLM-ready via extension hooks) | ✅ Backend + UI |
| Compliance Checker — CIS controls, scoring, reports | ✅ Backend + UI |
| FinOps Optimizer — cost recommendations, utilization, reports | ✅ Backend + UI |
| Migration Advisor — comparison, planning, risk/cost/downtime | ✅ Backend + UI |
| Observability — `/metrics` + Prometheus alerts + 6 Grafana dashboards + Loki/Alertmanager | ✅ Done |
| CI/CD — lint, tests, coverage, Docker, CodeQL, Trivy, Dependabot, GHCR deploy, Terraform | ✅ Done |
| Production hardening — TLS (Nginx), CSRF, Redis cache, resource limits, healthchecks | ✅ Done |
| Testing — 9 backend suites, 5 frontend, Playwright E2E scaffold, k6 load-test scaffold | ✅ Done |
| Profile Management - enterprise settings with 2FA, sessions, activity, cloud accounts, data export | ✅ Done |
| Remaining (Deployments UI, Kubernetes UI, Monitoring UI, Admin UI) | 🟡 Nav placeholder |
| Live cloud SDK validation against real accounts | 🟡 Code-complete; [runbook](docs/18-live-validation-runbook.md) provided |

> See the [merge checklist](docs/19-merge-checklist.md) and the full module docs in `docs/`.

---

## Profile Management

The platform includes an **enterprise-grade Profile Management** module with a tabbed settings UI (similar to GitHub Settings). Authenticated users can manage their identity, security, notifications, connected cloud accounts, and privacy all from one unified interface.

### Profile Information

- **Avatar upload**: drag-and-drop or click to upload (JPG, PNG, WebP, max 5 MB); base64-encoded and stored in MongoDB
- **Extended profile fields**: full name, organization, bio (max 500 chars), phone, country, time zone, job title
- **Profile completion percentage**: calculated from filled fields and displayed as a progress bar
- **Online presence indicator**: green dot (online) or grey dot (offline) based on lastSeenAt within 5 minutes

### Email Management

- Change email with current password verification
- Email format and uniqueness validation
- Verification status badge (Verified/Unverified) with option to resend verification

### Security (Password)

- Password change with strength indicator (8+ chars, uppercase, lowercase, number, special character)
- Show/hide toggle on all password fields
- Password match indicator for confirmation field
- Changing password signs out all other sessions

### Two-Factor Authentication (2FA)

- TOTP-based two-factor authentication using authenticator apps
- QR code setup flow with manual secret entry fallback
- 6-digit verification code confirmation
- 10 single-use backup recovery codes displayed in a grid with "Copy all" button
- View, regenerate, or disable 2FA (password required to disable)
- Dynamic imports for `otpauth` and `qrcode` libraries (optional dependencies)

### Active Sessions

- View all logged-in devices/sessions with creation and expiry dates
- "Current session" badge highlighting the active session
- Revoke individual sessions or all other sessions at once

### Login Activity

- Paginated login history table showing date/time, IP address, browser, and success/fail status
- Highlighted card showing most recent successful login
- User-agent parsing for browser identification

### Online Presence

- Real-time online/offline status via `lastSeenAt` timestamp
- Presence middleware updates on every authenticated request (fire-and-forget)
- Client-side calculation: online if lastSeenAt is within 5 minutes

### Notification Preferences

- Granular toggle switches for: Email Notifications, Security Alerts, Deployment Notifications, Monitoring Alerts, Marketing Emails
- Preferences persisted to the user model

### Theme Preferences

- Three theme options with visual cards: Light, Dark, System
- Active theme highlighted with brand styling
- Persisted via both localStorage and the backend profile

### Connected Cloud Accounts

- AWS, Azure, and GCP provider cards with status badges
- Connect flow: enter account ID and region
- Disconnect option for connected accounts
- Status tracking (connected/disconnected) with connection timestamp

### Security Activity Timeline

- Vertical timeline UI with icons based on action type (login, password change, email change, 2FA events)
- Paginated entries with description, timestamp, IP address, and success/fail status
- Audit trail of all security-relevant actions

### Data Export

- Download complete profile data as a JSON file
- Uses browser Blob URL and programmatic anchor click for download

### Account Deletion

- Multi-step confirmation flow in a modal dialog
- Requires current password entry
- "I understand this is irreversible" checkbox confirmation
- Soft-deletes account (sets isActive=false, anonymizes email)
- Revokes all tokens and logs out the user

### Security Score

- Calculated from: password set (+25), 2FA enabled (+25), email verified (+25), recent login within 30 days (+25)
- Color-coded badge: red (<50), amber (50-75), green (>75)

### Profile API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/profile` | Retrieve authenticated user's profile |
| `PUT` | `/api/profile` | Update basic profile fields (name, organization) |
| `PUT` | `/api/profile/extended` | Update extended fields (bio, phone, country, timezone, jobTitle) |
| `PUT` | `/api/profile/email` | Change email (requires current password) |
| `PUT` | `/api/profile/password` | Change password (enforces complexity rules) |
| `POST` | `/api/profile/avatar` | Upload or replace avatar image |
| `POST` | `/api/profile/2fa/setup` | Initialize 2FA setup (returns QR code and secret) |
| `POST` | `/api/profile/2fa/verify` | Verify TOTP token and enable 2FA |
| `POST` | `/api/profile/2fa/disable` | Disable 2FA (requires password) |
| `GET` | `/api/profile/2fa/backup-codes` | Retrieve current backup codes |
| `POST` | `/api/profile/2fa/backup-codes/regenerate` | Generate new backup codes |
| `GET` | `/api/profile/sessions` | List all active sessions |
| `DELETE` | `/api/profile/sessions/:id` | Revoke a specific session |
| `DELETE` | `/api/profile/sessions` | Revoke all other sessions |
| `GET` | `/api/profile/login-activity` | Paginated login history |
| `GET` | `/api/profile/security-activity` | Paginated security event timeline |
| `PUT` | `/api/profile/notifications` | Update notification preferences |
| `GET` | `/api/profile/cloud-accounts` | List connected cloud accounts |
| `POST` | `/api/profile/cloud-accounts` | Connect a cloud account |
| `DELETE` | `/api/profile/cloud-accounts/:provider` | Disconnect a cloud account |
| `GET` | `/api/profile/export` | Export profile data as JSON |
| `DELETE` | `/api/profile/account` | Delete account (requires password) |

---

## License

MIT — see [`LICENSE`](LICENSE).
