# Project Progress Analysis 

Based on the original design in `Planned.md`, here is a comprehensive breakdown of the current implementation state for the AI Proctoring System:

## 🟢 What is Fully Done (Completed)

* **Authentication System:**
  * Login with Email + Password.
  * JWT session creation and storage.
  * Dedicated Student & Admin roles and guarded UI routes.
* **Database & Architecture:**
  * Node.js/Express backend established.
  * MongoDB schemas fully configured (`User`, `Exam`, `Attempt`, `Event`).
  * Risk Score formula is actively functioning on the backend.
* **Student Dashboard:**
  * Lists upcoming, active, and completed exams.
  * Tracks and displays current attempt scores and scores upon completion.
* **Exam Joining flow:**
  * Join via code (`EXAM-ABC123`).
  * Automatic backend validation of the time window and duplicate attempt limits.
* **Core Exam UI (Frontend):**
  * Split-screen visual layout built (Google Form left, Webcam right).
  * Webcam feed automatically starts and mounts via the browser window.
  * Countdown timer functions accurately based on exam duration.
* **Admin Exam Control:**
  * Form to create exams, generate codes, and set start/end times and Google Form URLs.
* **Browser Monitoring Event Hookups:**
  * Client-side listener designed to detect Tab Switching and Window Blurring.
  * Frontend pushes events to backend `log-event` API correctly.

---

## 🟡 What is Partially Done

* **Admin Live Monitoring Panel:**
  * *Done:* The Admin Dashboard grid view successfully polls live student attempts, displaying their risk scores dynamically.
  * *Not Done:* Live camera snapshots (1 FPS) are not currently being uploaded or rendered in the grid.
* **AI Service (Python):**
  * *Done:* FastAPI boilerplate is up and running (`main.py` & `requirements.txt`).
  * *Not Done:* MediaPipe, OpenCV, and Whisper logic are merely placeholders. No actual video processing happens on the Python side yet.
* **Exam Engine Submission Constraints:**
  * *Done:* Our custom wrapper timeout triggers correctly.
  * *Not Done:* Auto-submit on timeout is fundamentally limited because we cannot force the inner Google Form `iframe` to submit gracefully via external Javascript (CORS restrictions mentioned in your Planned limits). 

---

## 🔴 What is Not Done (Missing Features)

* **AI Video Tracking (MediaPipe):**
  * Detecting "Face present / absent".
  * Detecting "Head direction (Looking Away)".
  * Detecting "Multiple people".
* **AI Audio Tracking (Whisper):**
  * Detecting talking or background voices.
* **Fullscreen Enforcement:**
  * We're not yet forcing the browser to enter lock-down / fullscreen mode when the exam starts.
* **Admin Details View for Students:**
  * The planned `/admin/student/:id` route where an admin can click a student's card and see an expanded timeline of events, risk score history, and video playback is not implemented.
* **Frame Upload Pipeline:**
  * The system isn't currently snapping webcam frames at 1 FPS and streaming them to the server for either Admin Viewing or Python AI analysis.
