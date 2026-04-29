Lets use google Forms for now, and change it later on.
The student and Admin sites should be seperate.

That flow makes sense—but a couple of tweaks will save you pain later:

* Embedding a **Google Form** directly limits control (you can’t tightly sync events or prevent tab switching properly). It’ll work for MVP, but for real production you’ll eventually want your **own exam UI**.
* Still, we can design this so you can **start with Google Forms → later replace with custom exam engine** without breaking everything.

---

# 🧩 Complete System Plan (Based on Your Flow)

## 🧑‍🎓 1. User Flow (Student Side)

### 🔐 Step 1: Login

* Email + password
* JWT session created

---

### 📊 Step 2: Dashboard

Shows:

* ✅ Upcoming exams
* ✅ Past exams
* ✅ Scores
* ✅ “Enter Exam Code”

**UI Sections:**

* “Active Exams”
* “Completed Exams”
* “Join Exam”

---

### 🎟️ Step 3: Join via Exam Code

User enters:

```
EXAM-ABC123
```

Backend:

* Validates code
* Checks:

  * time window
  * attempt limits

👉 If valid → redirect to exam session

---

### 📝 Step 4: Exam Page (Core)

Split screen:

```
| Google Form (left) | Camera Feed (right) |
```

#### Features:

* Webcam auto starts
* Mic optional
* Timer
* Auto-submit on timeout
* Background monitoring running

---

# 🎥 2. Monitoring System (Runs During Exam)

### 👁️ Video Checks

Using:

* MediaPipe
* OpenCV

Detect:

* Face present / absent
* Head direction
* Multiple people

---

### 🎤 Audio Checks

Using:

* Whisper

Detect:

* Talking
* Background voices

---

### 🌐 Browser Monitoring

* Tab switch detection
* Window blur detection
* Fullscreen enforcement

---

### 🚨 Events Generated

Each event stored like:

```json
{
  "user_id": "123",
  "event": "LOOKING_AWAY",
  "timestamp": "2026-04-29T10:21:00",
  "confidence": 0.82
}
```

---

# 🧠 3. Backend Design

## 🔹 Core APIs (Node.js)

### Auth

* POST /login
* POST /register

### Exams

* GET /dashboard
* POST /join-exam
* GET /exam/:id

### Monitoring

* POST /upload-frame
* POST /log-event

---

## 🔹 AI Service (Python)

Endpoints:

* `/detect-face`
* `/detect-headpose`
* `/detect-audio`

---

## 🔹 Database (Free)

Use:

* Mongo DB
### Tables:

#### Users

* id
* email
* password_hash

#### Exams

* id
* code
* form_url
* start_time
* end_time

#### Attempts

* id
* user_id
* exam_id
* score
* status

#### Events

* id
* attempt_id
* type
* timestamp

---

# 🧑‍🏫 4. Admin Panel (VERY IMPORTANT)

## 🎛️ Features

### 🟢 Live Monitoring

* Grid view of students
* Live camera snapshots (1 FPS)
* Status:

  * 🟢 Normal
  * 🟡 Suspicious
  * 🔴 Critical

---

### 📊 Student Detail View

Click a student → see:

* Timeline of events
* Risk score
* Video playback
* Logs

---

### 📁 Exam Control

* Create exam
* Generate code
* Upload Google Form link
* Set duration

---

# 🧮 5. Risk Score System

Keep it simple:

```id="f4k8bz"
risk = 
  30 * (multiple_faces) +
  20 * (no_face) +
  20 * (looking_away) +
  15 * (audio_detected) +
  15 * (tab_switch)
```

---

# 🖥️ 6. Frontend Pages

## Student Side

* /login
* /register
* /dashboard
* /exam/:id

---

## Admin Side

* /admin/login
* /admin/dashboard
* /admin/exam/:id
* /admin/student/:id

---

# ⚙️ 7. Tech Stack (All Free)

### Frontend

* React (Vite)

### Backend

* Node.js (Express)

### AI

* Python + OpenCV + MediaPipe

### DB

* mongo db

### Storage

* Local 

---

# 🔒 8. Important Limitations (Be Realistic)

With Google Forms:

* ❌ Cannot fully control cheating
* ❌ Cannot lock screen properly
* ❌ User can open another device

👉 This is fine for:

* college projects
* internal exams

---

# 🚀 9. Smart Upgrade Path (Later)

When ready:

Replace Google Form with:

* Custom question engine
* Auto grading
* Full control

--