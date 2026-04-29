Listed directory Group%203
Viewed Planned.md:1-320

I have analyzed the **Planned.md** file. It outlines a comprehensive architecture for an AI-powered proctoring system using a "hybrid" approach—leveraging Google Forms for the exam content while building a custom proctoring wrapper.

### **Core Architecture Summary**

| Component | Technology | Key Features |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Student Dashboard, Admin Panel, Split-screen Exam UI. |
| **Backend** | Node.js (Express) | Auth (JWT), Exam Management, Event Logging. |
| **AI Service** | Python (OpenCV, MediaPipe) | Face Detection, Head Pose (looking away), Audio detection. |
| **Database** | MongoDB | Storing Users, Exams, Attempts, and Proctoring Events. |

---

### **Key Strengths**
1.  **Low Friction MVP:** Using Google Forms allows you to focus 100% on the **proctoring logic** and AI, rather than spending weeks building a question-rendering engine.
2.  **Risk Scoring System:** The weighted risk scores (Line 241) provide a quantifiable metric for admins, making it easier to identify cheaters without watching every video feed.
3.  **Cross-Platform Monitoring:** Monitoring covers video (MediaPipe), audio (Whisper), and browser behavior (Tab switching), providing multiple layers of security.

### **Technical Observations & Suggestions**

#### **1. AI Execution Strategy**
The plan (Line 147) suggests uploading frames to the backend. 
*   **Concern:** Uploading high-res frames to a Python backend for every user every second will consume massive bandwidth and server CPU.
*   **Suggestion:** Consider running **MediaPipe in the browser (JS version)**. The student's browser can detect "No Face" or "Looking Away" locally and only send the *event* to your server. This makes the system scale to hundreds of students on a single server.

#### **2. The "Google Form" Integration**
*   **Challenge:** Google Forms cannot be easily controlled via Javascript from an external wrapper due to `iframe` security (Cross-Origin policies). You won't be able to "Auto-submit" the Google Form on timeout through your React code.
*   **Workaround:** You may need to rely on the Google Form's own "Timer" add-ons or simply block the student's view of the form when your timer hits zero.

#### **3. Privacy and Data**
*   **Missing:** The plan doesn't mention where video snapshots are stored. If you are using "Free" services, storage will fill up quickly. 
*   **Recommendation:** Use a "Buffer" approach—only keep snapshots associated with "High Risk" events to save space and respect privacy.

#### **4. Admin Live Monitoring**
*   The "Grid view of students" (Line 206) with 1 FPS snapshots is excellent for "Classroom" style monitoring.

### **Next Steps Recommendation**
I recommend starting with the **Backend Structure** and **Database Schema** first, as the AI and Frontend will depend on having a place to store sessions and events.

**Would you like me to start by generating the initial project structure or focusing on a specific component (like the Node.js backend or the AI service script)?**