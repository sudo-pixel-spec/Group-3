# 🎓 AI-Powered Exam Proctoring System

A full-stack proctoring platform that monitors students during online exams using AI-powered face detection, audio analysis, and browser behavior tracking.

## 📁 Project Structure

```
Group 3/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite Student/Admin UI
└── ai_service/       # Python + FastAPI AI analysis service
```

---

## 🚀 Getting Started

### 1. Backend (Node.js)

```bash
cd backend
cp .env.example .env    # Fill in your MONGO_URI and JWT_SECRET
npm install
npm run dev             # Starts on http://localhost:5000
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

### 3. AI Service (Python)

```bash
cd ai_service
pip install -r requirements.txt
python main.py          # Starts on http://localhost:8000
```

---

## 🌐 API Overview

| Method | Endpoint                   | Description            |
|--------|----------------------------|------------------------|
| POST   | /api/auth/register         | Register a new user    |
| POST   | /api/auth/login            | Login and get JWT      |
| GET    | /api/exams/dashboard       | Student dashboard data |
| POST   | /api/exams/join-exam       | Join exam by code      |
| GET    | /api/exams/:id             | Get exam details       |
| POST   | /api/monitoring/log-event  | Log a proctoring event |

---

## 🧠 Tech Stack

- **Frontend**: React + Vite + React Router
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **AI**: Python + FastAPI + OpenCV + MediaPipe
- **Auth**: JWT (JSON Web Tokens)

---

## 👥 Group 3
