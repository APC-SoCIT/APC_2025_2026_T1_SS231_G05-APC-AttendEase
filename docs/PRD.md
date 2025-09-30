# Product Requirements Document (PRD): AttendEase

## 1. Introduction

### 1.1 Project Purpose
Current attendance tracking methods at Asia Pacific College (APC) for its HyFlex learning model are largely manual, time-consuming, error-prone, and inefficient. This project aims to solve these challenges by implementing an automated attendance system designed specifically for APC's environment, thereby reducing the administrative burden on faculty and improving the accuracy of attendance records.

### 1.2 High-level Project Description
AttendEase is an automated attendance system integrated directly into Microsoft Teams. It utilizes existing classroom cameras for facial recognition to track in-person students and an MS Teams bot to log online participants. All attendance data is consolidated into a single, easy-to-access platform, providing professors and administrators with real-time insights and reports.

---

## 2. Goals & Objectives

The primary goal is to enhance operational efficiency by reducing the administrative burden on instructors, allowing them to focus more on teaching.

### 2.1 Categorized Objectives
* **Automation & Efficiency**: To develop and deploy an automated attendance system that accurately records both in-person and online students in real-time without disrupting class, by the end of Year 3, Term 3.
* **Data & Reporting**: To create a centralized, user-friendly dashboard by the second month of Year 3, Term 3, that gives professors and administrators real-time access to attendance records and allows for the automatic generation of reports.
* **Technical Integration & Compliance**: To fully integrate AttendEase with APC’s existing classroom cameras and Microsoft Teams platform by the end of Year 3, Term 3, ensuring compliance with institutional data privacy policies.
* **Feature Expansion**: To implement a visual-based engagement monitoring system for onsite classes that can identify and validate student engagement using observable behavioral cues (e.g., facial orientation, hand-raising) by the end of Year 3, Term 3.

---

## 3. Scope

### 3.1 In Scope
* **Automated Tracking**: The system will employ facial recognition for students physically present and will use Microsoft Teams data to record virtual attendance.
* **Centralized Dashboard**: A unified dashboard accessible within MS Teams for professors and administrators to view attendance information and generate reports.
* **Engagement Monitoring**: The system will track online participation (e.g., chat messages, voice responses) and detect observable physical cues (e.g., head orientation, hand raising, signs of disengagement) for onsite students.
* **Platform Integration**: The system is designed specifically for APC’s environment, using existing Logitech cameras and the Microsoft Teams platform.

### 3.2 Out of Scope
* **Other Platforms**: The system will not support other video conferencing platforms like Zoom or Google Meet.
* **Qualitative Analysis**: The system will not evaluate the quality or contextual relevance of student contributions.
* **Grading System Integration**: The system will not have direct integration with official grading systems.

---

## 4. Use Cases

* **UC-001 Authenticate**: A user (Student, Professor, or App Manager) securely logs into the system using their official school credentials via Microsoft SSO.
* **UC-002 Manage Facial Profile**: A student registers their facial data for the first time or updates their existing data after providing consent.
* **UC-003 View Attendance Dashboard**: A professor monitors real-time, consolidated attendance for both in-person and online students during an active class session.
* **UC-004 Generate Attendance Report**: A professor generates and exports a final, official attendance record for a completed class session.
* **UC-005 Manage User Accounts**: A System Administrator provisions, modifies, or deactivates user accounts.
* **UC-006 Manage Course Data**: A System Administrator uploads or updates course schedules, sections, and student rosters.
* **UC-007 Configure System Settings**: A System Administrator adjusts system-wide parameters, such as the time threshold for being marked 'Late'.

---

## 5. Technical Architecture

| Component                 | Technology                     |
| :-------------------------| :----------------------------- |
| **Frontend**              | **React**                      |
| **Backend**               | **Python**                     |
| **Communication**         | REST + WebSockets              |
| **Database**              | Existing APC database          |
| **Open Source Libraries** | **dlib**, **face_recognition** |

---

## 6. Key Features

* **Automated Hybrid Attendance Tracking**: Real-time recording of both in-person (via facial recognition) and online (via MS Teams bot) student attendance.
* **Centralized Real-Time Dashboard**: A unified interface within MS Teams for professors to view live attendance data and summary statistics for a class session.
* **Consolidated Report Generation**: Ability for professors to generate and export detailed attendance reports for administrative purposes.
* **Student Facial Profile Management**: A secure, consent-based workflow for students to register and manage their facial data for recognition.
* **Visual-based Engagement Monitoring**: The system will identify and log observable behavioral cues (e.g., facial orientation, hand-raising) to provide insights into student engagement beyond simple presence.
* **System Administration**: Dedicated functionality for administrators to manage user accounts, course data, and system-wide settings.

---

## 7. Non-Functional Requirements

* **Security & Privacy**: The system must ensure compliance with institutional data privacy policies, especially regarding the handling of biometric data. All access must be secured through user authentication.
* **Performance**: The system must be capable of processing facial recognition and consolidating data in real-time to provide an accurate live dashboard without disrupting instructional flow.
* **Usability**: The professor and administrator dashboards must be user-friendly and allow for easy access to records and reports.