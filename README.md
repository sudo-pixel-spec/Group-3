# ViZi Proctor Ai

**ViZi Proctor Ai** is a full-stack online exam proctoring platform for educational institutions. It combines browser-based monitoring (face detection, audio, tab and window behavior), optional server-side computer vision (MediaPipe + YOLO via FastAPI), and an admin console for live session oversight, risk scoring, and post-session review.

---

## Table of contents

1. [Capabilities](#capabilities)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Repository layout](#repository-layout)
5. [Prerequisites](#prerequisites)
6. [Installation and local run](#installation-and-local-run)
7. [Configuration](#configuration)
8. [API overview](#api-overview)
9. [Proctoring model](#proctoring-model)
10. [Testing](#testing)
11. [Security and limitations](#security-and-limitations)
12. [License and attribution](#license-and-attribution)

---

## Capabilities

**Students**

- Email and password authentication with JWT.
- Role-aware registration (student or admin).
- Dashboard for upcoming, active, and completed exams.
- Join exams with a short exam code.
- Proctored exam experience: embedded assessment (Google Form URL), webcam preview, countdown timer, fullscreen enforcement with event logging, and continuous risk score updates.
- Email summary after exam submission (MailerSend), when configured.

**Administrators**

- Create exams (title, form URL, schedule, duration).
- Live monitoring of in-progress attempts with periodic snapshot refresh.
- Per-student detail: risk gauge, latest frame, chronological event timeline.

**Monitoring pipeline**

- Client-side events (tab visibility, blur, mouse leaving window, selected keyboard shortcuts, audio level).
- Optional **AI service**: frame analysis with MediaPipe face detection and Ultralytics YOLO for phone and generic object cues; results can auto-create persisted events and adjust risk.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React SPA (Vite) — student & admin UIs                     │
│  MediaPipe (CDN) + Web Audio + browser event hooks          │
└────────────────────────────┬────────────────────────────────┘
                               │ HTTPS / JSON + JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Express API — auth, exams, attempts, events, frames        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐   ┌─────────────────────────────┐
│  MongoDB                 │   │  FastAPI AI (optional)      │
│  Users, exams, attempts, │   │  /analyze-frame             │
│  events                  │   │  MediaPipe + YOLO           │
└──────────────────────────┘   └─────────────────────────────┘
```

The backend can run with MongoDB Atlas, a local MongoDB instance, or, for quick local demos, an **in-memory MongoDB** when `MONGO_URI` is unset or points to localhost (see `backend/server.js`).

---

## Tech stack

| Area | Technologies |
|------|----------------|
| Frontend | React 19, React Router 7, Vite 8, Axios |
| Backend | Node.js, Express 5, Mongoose, JWT, bcrypt |
| Email | MailerSend (transactional) |
| Database | MongoDB |
| AI service | Python 3.9+, FastAPI, OpenCV, MediaPipe, Ultralytics YOLO |

---

## Repository layout

```
Group 3/
├── backend/                 # REST API
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── test.js
│   └── .env.example
├── frontend/                # Single-page application
│   └── src/
├── ai_service/              # Optional FastAPI analyzer
│   ├── main.py
│   └── requirements.txt
├── reference/               # Legacy snippets (not wired to build)
├── Planned.md
└── README.md
```

---

## Prerequisites

- **Node.js** 18 or newer  
- **Python** 3.9 or newer (only if you run `ai_service`)  
- **MongoDB** (recommended for production); optional for quick local API smoke tests  

---

## Installation and local run

### 1. Clone the repository

```bash
git clone https://github.com/sudo-pixel-spec/Group-3
cd "Group 3"
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — see Configuration
npm run dev
```

Default API base URL: `http://localhost:5000`  
Health check: `GET http://localhost:5000/health`

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL if the API is not on localhost:5000
npm run dev
```

Default app URL: `http://localhost:5173`

### 4. AI service (optional)

```bash
cd ai_service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Service URL: `http://localhost:8000`  
Health check: `GET http://localhost:8000/health`

Point the backend at this service with `AI_SERVICE_URL` (see below). On first run, YOLO may download model weights; ensure outbound network access or place weights according to Ultralytics documentation.

### Production build (frontend)

```bash
cd frontend
npm run build
npm run preview   # optional local preview of dist/
```

---

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | HTTP port (default `5000`) |
| `MONGO_URI` | Recommended | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `AI_SERVICE_URL` | No | Base URL of FastAPI service (default `http://localhost:8000`) |
| `MAILERSEND_API_KEY` | No | MailerSend API token |
| `MAILERSEND_FROM_EMAIL` | No | Verified sender address in MailerSend |
| `MAILERSEND_FROM_NAME` | No | Display name for outbound mail |

If MailerSend variables are omitted, exam submission still succeeds; email is skipped.

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API origin including port, e.g. `http://localhost:5000` (no trailing `/api`; the client appends `/api`) |

---

## API overview

Base path: `/api`. Send `Authorization: Bearer <token>` for protected routes.

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Body: `email`, `password`, `role` (`student` \| `admin`) |
| `POST` | `/api/auth/login` | Body: `email`, `password` — returns JWT |

### Exams

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/exams/dashboard` | Student | Upcoming, active, and completed attempts |
| `POST` | `/api/exams/join-exam` | Student | Body: `code` — join by exam code |
| `GET` | `/api/exams/:id` | Authenticated | Exam details and student attempt when applicable |
| `POST` | `/api/exams/:id/submit` | Student | Submit in-progress attempt |
| `POST` | `/api/exams/create` | Admin | Create exam |
| `GET` | `/api/exams/admin/list` | Admin | Exams with aggregate attempt stats |
| `GET` | `/api/exams/admin/:id/attempts` | Admin | Attempts grouped for monitoring UI |

### Monitoring

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/monitoring/log-event` | Student | Body: `attempt_id`, `event_type`, optional `confidence` |
| `POST` | `/api/monitoring/upload-frame` | Student | Body: `attempt_id`, `frame` (base64 data URL) — stores snapshot, optional AI inference |
| `GET` | `/api/monitoring/live` | Admin | Recently active in-progress attempts |
| `GET` | `/api/monitoring/attempt/:attempt_id/events` | Admin | Events for one attempt |
| `GET` | `/api/monitoring/attempt/:attempt_id/detail` | Admin | Attempt, user, exam, and full event list |

---

## Proctoring model

**Event types** (persisted on `Event` documents) include, among others: `NO_FACE`, `MULTIPLE_FACES`, `LOOKING_AWAY`, `AUDIO_DETECTED`, `TAB_SWITCH`, `BLURRED_WINDOW`, `MOUSE_OFF_SCREEN`, `KEYBOARD_SHORTCUT`, `PHONE_DETECTED`, `OBJECT_DETECTED`.

**Risk score** increases per event type according to server-side weights in `backend/controllers/monitoring.controller.js`, capped at **100**. Auto-generated events from the AI path are throttled (same type per attempt within a short window) to avoid spamming the database.

**Email reports** after submit include exam metadata and attempt summary when MailerSend is configured.

---

## Testing

```bash
cd backend
node --check server.js
node test.js
```

`test.js` exercises registration, exam creation, join, event logging, and admin live feed against a running server.

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

---

## Security and limitations

- **Browser-only controls** (for example, disabling context menu or blocking copy and paste in the SPA) reduce casual misuse; they do **not** stop determined users, other devices, virtual machines, or OS-level screen capture.
- **Embedded third-party forms** (Google Forms in an iframe) run in another origin. Your application cannot fully instrument or harden that inner document; timer and UX mitigations apply only to your shell.
- **JWT storage** in `localStorage` is common for demos; production deployments should evaluate HttpOnly cookies, HTTPS everywhere, CSP, rate limiting, and audit logging.
- **PII and media**: webcam frames and events are sensitive; secure MongoDB, restrict admin access, and define retention policies appropriate to your jurisdiction (for example, GDPR or FERPA).

---

## License and attribution

**Group 3** — academic project demonstrating AI-assisted online exam proctoring.
