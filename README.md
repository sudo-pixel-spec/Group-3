# 🎓 ProctorAI — AI-Powered Exam Proctoring System

A full-stack, AI-driven online exam proctoring platform that monitors students in real-time using face detection, audio analysis, and browser behavior tracking. Built for universities, colleges, and institutions conducting online assessments.

---

## 📸 System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        STUDENT BROWSER                          │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │   Google Form        │  │  📷 Webcam Feed                  │  │
│  │   (Exam Questions)   │  │  🧠 MediaPipe Face Detection     │  │
│  │                      │  │  🎤 Audio Monitoring              │  │
│  │                      │  │  ⏱ Timer + Risk Score            │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│            Tab Switch / Fullscreen / Browser Monitoring          │
└──────────────────────┬───────────────────────────────────────────┘
                       │  Events + Frames (1 FPS)
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     NODE.JS BACKEND (Express)                    │
│  Auth (JWT) │ Exam CRUD │ Event Logging │ Risk Scoring │ Frames │
└──────────────────────┬───────────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
┌──────────────────┐  ┌─────────────────────┐
│   MongoDB        │  │  Python AI Service  │
│   (Atlas/Local)  │  │  FastAPI + MediaPipe │
└──────────────────┘  └─────────────────────┘
```

---

## ✨ Features

### 🧑‍🎓 Student Side
- **Login / Register** — Email + password with JWT sessions
- **Dashboard** — View upcoming, active, and completed exams with scores
- **Join via Exam Code** — Enter a code like `EXAM-ABC123` to join a live exam
- **Split-Screen Exam UI** — Google Form on the left, webcam + monitoring panel on the right
- **Countdown Timer** — Auto-submits when time runs out
- **Fullscreen Lock** — Browser enters fullscreen; exit attempts are logged
- **Email Report** — Sends exam submission report to student email using MailerSend

### 🧑‍🏫 Admin Side
- **Admin Dashboard** — Live grid of all active student sessions
- **Live Snapshots** — 1 FPS webcam thumbnails per student, refreshed every 5 seconds
- **Risk Score Badges** — 🟢 Normal / 🟡 Suspicious / 🔴 Critical
- **Create Exams** — Set title, Google Form URL, schedule, and duration
- **Student Detail View** — Click any student to see full timeline, risk gauge, and last snapshot

### 🤖 AI Monitoring (Real-Time)
| Detection | Method | Event Type |
|-----------|--------|------------|
| No face in frame | MediaPipe (Browser) | `NO_FACE` |
| Multiple faces | MediaPipe (Browser) | `MULTIPLE_FACES` |
| Looking away | Bounding box analysis | `LOOKING_AWAY` |
| Talking / voices | Web Audio API | `AUDIO_DETECTED` |
| Phone detected | YOLOv8 object detection | `PHONE_DETECTED` |
| Tab switch | Visibility API | `TAB_SWITCH` |
| Window blur | Blur event | `BLURRED_WINDOW` |

### 🧮 Risk Score Formula
```
risk = 30 × (multiple_faces)
     + 20 × (no_face)
     + 20 × (looking_away)
     + 15 × (audio_detected)
     + 35 × (phone_detected)
     + 15 × (tab_switch)
```
Score accumulates in real-time, capped at 100.

---

## 📁 Project Structure

```
ProctorAI/
├── backend/                          # Node.js + Express API
│   ├── controllers/
│   │   ├── auth.controller.js        # Register & Login with JWT
│   │   ├── exam.controller.js        # CRUD + Join exam logic
│   │   └── monitoring.controller.js  # Events, frames, risk score, live feed
│   ├── middleware/
│   │   └── auth.middleware.js        # JWT verification + admin guard
│   ├── models/
│   │   ├── User.js                   # email, password_hash, role
│   │   ├── Exam.js                   # code, form_url, schedule
│   │   ├── Attempt.js                # session tracking + risk_score + last_frame
│   │   └── Event.js                  # proctoring events with confidence
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── exam.routes.js
│   │   └── monitoring.routes.js
│   ├── server.js                     # Entry point
│   ├── test.js                       # E2E API test script
│   ├── .env.example
│   └── package.json
│
├── frontend/                         # React + Vite
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx             # Auth with role-based redirect
│       │   ├── Register.jsx          # Student / Admin registration
│       │   ├── Dashboard.jsx         # Student exam dashboard
│       │   ├── ExamPage.jsx          # Split-screen proctored exam
│       │   ├── AdminDashboard.jsx    # Live monitoring + exam creation
│       │   └── AdminStudentDetail.jsx # Event timeline + risk gauge
│       ├── services/
│       │   └── api.js                # Axios client + JWT interceptor
│       ├── App.jsx                   # Router + route guards
│       └── index.css                 # Dark-mode design system
│
├── ai_service/                       # Python + FastAPI
│   ├── main.py                       # MediaPipe face detection API
│   └── requirements.txt
│
├── Planned.md                        # Original system design document
└── README.md                         # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+
- **MongoDB** (Atlas cloud or local instance)

### 1. Clone the Repository
```bash
git clone <repo-url>
cd "Group 3"
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/proctoring_db
JWT_SECRET=your_secret_key_here
MAILERSEND_API_KEY=your_mailersend_api_key
MAILERSEND_FROM_EMAIL=verified-sender@yourdomain.com
MAILERSEND_FROM_NAME=ProctorAI
```

> **Note:** If no MongoDB is available, the backend automatically uses an in-memory MongoDB instance for local development.

```bash
npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

### 4. AI Service Setup (Optional)
```bash
cd ai_service
pip install -r requirements.txt
python main.py
# API starts on http://localhost:8000
```

> The system works without the Python service — browser-side MediaPipe handles all real-time detection. The Python service provides an additional server-side analysis layer.

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | `{ email, password, role }` | Register user |
| `POST` | `/api/auth/login` | `{ email, password }` | Login → JWT token |

### Exams
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/exams/dashboard` | Student | Get dashboard data |
| `POST` | `/api/exams/join-exam` | Student | Join exam by code |
| `POST` | `/api/exams/create` | Admin | Create new exam |
| `GET` | `/api/exams/:id` | Auth | Get exam details |

### Monitoring
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/monitoring/log-event` | Student | Log a proctoring event |
| `POST` | `/api/monitoring/upload-frame` | Student | Upload webcam snapshot |
| `GET` | `/api/monitoring/live` | Admin | Get all active sessions |
| `GET` | `/api/monitoring/attempt/:id/events` | Admin | Get events for attempt |
| `GET` | `/api/monitoring/attempt/:id/detail` | Admin | Full attempt + events |

---

## 🧪 Running Tests

```bash
cd backend

# Syntax check (all files)
node --check server.js && echo "✅ OK"

# Full E2E API test
node test.js
```

Expected output:
```
--- E2E API Test Suite ---
1. Registering Admin...        ✅
2. Creating Exam as Admin...   ✅ EXAM-XXXXXX
3. Registering Student...      ✅
4. Joining Exam as Student...  ✅
5. Logging Event...            ✅ Risk Score: 20
6. Admin Live Feed...          ✅

🎉 All backend tests passed!
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, React Router 7, Axios |
| **Backend** | Node.js, Express, Mongoose, JWT, bcrypt |
| **Database** | MongoDB (Atlas / Local / In-Memory) |
| **AI (Browser)** | MediaPipe Face Detection, Web Audio API |
| **AI (Server)** | Python, FastAPI, OpenCV, MediaPipe |
| **Styling** | Vanilla CSS (dark-mode design system) |

---

## ⚠️ Known Limitations

- **Google Forms iframe** — Cannot auto-submit or fully control the embedded form due to cross-origin restrictions. The custom timer blocks the view when time expires.
- **Single device** — Cannot detect if a student opens a second device. This is a fundamental browser limitation.
- **Fullscreen** — Browsers allow users to exit fullscreen; we re-request it and log the event, but cannot truly lock the screen.

---

## 🔮 Future Enhancements

- [ ] Custom question engine to replace Google Forms
- [ ] Auto-grading system
- [ ] Whisper-based server-side audio transcription
- [ ] Video recording playback for post-exam review
- [ ] WebSocket-based real-time Admin updates (instead of polling)
- [ ] Multi-camera support
- [ ] Export exam reports as PDF

---

## 👥 Group 3

Built as a college project demonstrating AI-powered exam proctoring capabilities.
