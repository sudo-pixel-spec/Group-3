AI-Based Online Examination Proctoring System

An intelligent web-based examination platform designed to conduct secure MCQ examinations with real-time webcam monitoring and automated cheating detection. The system combines a modern exam interface with browser-based AI proctoring to maintain exam integrity during online assessments.

Project Overview

This application allows students to log in, attempt multiple-choice examinations, and be monitored through their webcam throughout the test session. The system detects suspicious behavior such as absence from screen, multiple faces, looking away frequently, tab switching, and fullscreen exit attempts. All violations are logged with timestamps for review.

The platform is designed for colleges, institutes, recruitment tests, and remote assessments where secure online examinations are required.

Key Features
Student Examination Portal
Secure student login
Timed MCQ examination interface
Auto-save answers during test
Question navigation panel
Automatic submission on timer completion
AI Proctoring System
Real-time webcam monitoring
Face presence detection
Multiple face detection
Head movement / looking away detection
Suspicious activity warnings
Optional screenshot evidence capture
Browser Security Monitoring
Detect tab switching
Detect window focus loss
Detect fullscreen exit
Disable copy/paste and right click during exam
Violation counting with auto-submit rules
Admin / Faculty Module
Create examinations
Manage question banks
Review student submissions
View proctoring violation logs
Generate results
Technology Stack
Frontend
React.js
AI Detection
MediaPipe Face Detection
MediaPipe Face Mesh
JavaScript Browser APIs
Backend
Firebase / Node.js / Express.js
Database
Firebase Firestore / MongoDB
How It Works
Student logs into the portal
Webcam permission is requested
Examination starts in fullscreen mode
AI continuously monitors candidate behavior
Suspicious events are recorded in real time
Answers are submitted manually or automatically after timer ends
Admin reviews reports and results
Use Cases
University online exams
Internal college assessments
Recruitment aptitude tests
Certification examinations
Remote learning evaluations
Objective

To create a smart, scalable, and secure online examination system that reduces manual invigilation effort while improving fairness and credibility of remote assessments.

Future Enhancements
Voice/noise detection
Mobile phone object detection
Live proctor dashboard
Face recognition authentication
AI risk score generation
Detailed analytics reports
Team Contribution Modules
Frontend UI & Exam Flow
AI Proctoring Module
Backend APIs & Database
Security Monitoring & Integration
Conclusion

This project demonstrates how artificial intelligence and web technologies can be combined to solve real-world remote examination challenges by building a reliable, efficient, and modern online proctoring platform.
