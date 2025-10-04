# 012 Fully Dressed Use Case

## Use Case ID: UC-001
## Use Case Name: Authenticate

| Field | Description |
| :--- | :--- |
| **Scenario** | A user (Student, Professor, or App Manager) securely logs into the AttendEase system using their official school credentials. |
| **Triggering Event** | The user launches the AttendEase application within Microsoft Teams for the first time or after a previous session has expired. |
| **Brief Description** | The system requires all users to authenticate to ensure secure access to their respective features. The user provides their credentials via a Microsoft Single Sign-On (SSO) prompt, and the system verifies their identity and role to grant appropriate access. |
| **Actor(s)** | **Primary Actor(s):** Student, Professor, App Manager<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** Microsoft Teams Authentication Service |
| **Related Use Case(s)** | This use case is **included** by all other use cases as a mandatory prerequisite. |
| **Stakeholder(s)** | **All Users:** Want a simple and secure way to access the system.<br>**App Manager:** Wants to ensure only authorized individuals can access system data and functions. |
| **Precondition(s)** | 1. The user has an active Asia Pacific College account.<br>2. The AttendEase application is installed in the user's Microsoft Teams environment. |
| **Postcondition(s)** | 1. The user is successfully logged into the AttendEase system.<br>2. The system establishes a secure session for the user based on their role (Student, Professor, or App Manager). |
| **Flow of Events** | **Basic Flow:**<br>1. User clicks on the AttendEase app icon within Microsoft Teams.<br>2. The system presents a login screen prompting to "Sign in with School Email."<br>3. User clicks the sign-in button, triggering the Microsoft SSO prompt.<br>4. User enters their school credentials (if not already cached by the browser/Teams).<br>5. The system receives an authentication token from Microsoft, verifies it, and grants access. |

***

## Use Case ID: UC-002
## Use Case Name: Manage Facial Profile

| Field | Description |
| :--- | :--- |
| **Scenario** | A new student registers their facial data for the first time, or an existing student updates their data. |
| **Triggering Event** | A student logs in for the first time and is prompted for registration, or they manually select the "Manage Facial Profile" option from their dashboard. |
| **Brief Description** | To enable facial recognition for in-person attendance, the student must provide their facial data. The system guides the student through reviewing terms, capturing an image via their device's camera, and confirming their identity. |
| **Actor(s)** | **Primary Actor(s):** Student<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** None |
| **Related Use Case(s)** | Authenticate (UC-001) is included. |
| **Stakeholder(s)** | **Student:** Wants an easy way to register their face so their attendance is counted correctly.<br>**Professor:** Relies on accurate facial data for the system to work.<br>**App Manager:** Wants to ensure biometric data is collected with user consent and stored securely. |
| **Precondition(s)** | 1. The student is authenticated into the AttendEase system (UC-001).<br>2. The student's device has a functional camera. |
| **Postcondition(s)** | 1. The student's facial data is securely stored and associated with their account.<br>2. The student is ready for in-person attendance tracking. |
| **Flow of Events** | **Basic Flow (First-Time Registration):**<br>1. After authenticating, the system prompts the student to register their face.<br>2. The system presents the Terms and Conditions for biometric data consent.<br>3. The student accepts the terms.<br>4. The facial registration interface opens and activates the device camera.<br>5. The student positions their face and captures the image.<br>6. The student submits the image.<br>7. The system processes the image and displays a confirmation screen with the student's name, course, and section.<br>**Alternative Flow: Update Facial Profile**<br>1. Student selects "Update Facial Profile" from their settings.<br>2. The flow proceeds from Step 4 of the Basic Flow. |

***

## Use Case ID: UC-003
## Use Case Name: View Attendance Dashboard

| Field | Description |
| :--- | :--- |
| **Scenario** | A professor monitors real-time attendance during an active HyFlex class session. |
| **Triggering Event** | A professor monitors real-time attendance during an active HyFlex class session. |
| **Brief Description** | The professor needs to see who is present in real-time. After selecting the current class, the system displays a live dashboard that consolidates data for both in-person students (via facial recognition) and online students (via the Teams bot), providing a unified view of class attendance and engagement. |
| **Actor(s)** | **Primary Actor(s):** Professor<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** Student, App Manager |
| **Related Use Case(s)** | Authenticate (UC-001) is included. |
| **Stakeholder(s)** | **Professor:** Wants to accurately and efficiently monitor student attendance without disrupting class.<br>**App Manager:** Wants to ensure the system provides reliable and timely data to faculty. |
| **Precondition(s)** | 1. The professor is authenticated into the AttendEase application (UC-001).<br>2. An active class session is in progress.<br>3. Students have registered their facial profiles for in-person recognition. |
| **Postcondition(s)** | 1. The professor has a clear, real-time view of attendance for the selected class.<br>2. Attendance data is successfully consolidated and displayed on the dashboard. |
| **Flow of Events** | **Basic Flow:**<br>1. The professor launches the AttendEase app from within MS Teams.<br>2. The system presents the professor's class schedule.<br>3. The professor selects the current, active class session.<br>4. The system displays the real-time Attendance Dashboard.<br>5. The dashboard shows a live camera feed for in-person students with facial recognition overlays and a list of online participants from the Teams bot.<br>6. The dashboard displays summary statistics (e.g., number of present, absent, late students). |

***

## Use Case ID: UC-004
## Use Case Name: Generate Attendance Report

| Field | Description |
| :--- | :--- |
| **Scenario** | A professor generates a final attendance report for a completed class session for record-keeping. |
| **Triggering Event** | The professor selects a completed class from their schedule and chooses the option to view or export the report. |
| **Brief Description** | After a class has ended, the professor needs a final, official record of attendance. The system allows the professor to select a past session and view a detailed report, which can be exported for administrative purposes. |
| **Actor(s)** | **Primary Actor(s):** Professor<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** Student, App Manager |
| **Related Use Case(s)** | Authenticate (UC-001) is included. |
| **Stakeholder(s)** | **Professor:** Needs an easy way to get accurate attendance records for grading and administrative reporting.<br>**App Manager:** Wants to provide faculty with useful and easily exportable data. |
| **Precondition(s)** | 1. The professor is authenticated into the AttendEase application (UC-001).<br>2. The selected class session has been completed. |
| **Postcondition(s)** | 1. A comprehensive attendance report for the selected session is displayed.<br>2. The report is successfully exported to a standard file format (e.g., CSV, PDF) if requested. |
| **Flow of Events** | **Basic Flow:**<br>1. The professor navigates to their class schedule within the AttendEase app.<br>2. The professor selects a past class session.<br>3. The system displays the final attendance summary for that session (as seen in mockup Fig. 10).<br>4. The professor clicks the "Export Report" button.<br>5. The system generates the report as a downloadable file.<br>**Alternative Flow: No Data Available**<br>1. The professor selects a class for which data processing failed or is incomplete.<br>2. The system displays a message indicating that the report is not yet available and to check back later. |

***

## Use Case ID: UC-005
## Use Case Name: Manage User Accounts

| Field | Description |
| :--- | :--- |
| **Scenario** | An App Manager provisions, modifies, or deactivates user accounts for students and professors. |
| **Triggering Event** | The App Manager needs to update user access based on enrollment changes, new hires, or policy requirements. |
| **Brief Description** | The App Manager performs user lifecycle management. This includes creating accounts for new users, assigning them the correct roles (Student, Professor), and deactivating accounts for those who have left the institution. |
| **Actor(s)** | **Primary Actor(s):** App Manager<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** Professor, Student |
| **Related Use Case(s)** | Authenticate (UC-001) is included. |
| **Stakeholder(s)** | **App Manager:** Needs efficient tools to maintain an accurate and secure user base.<br>**Users (Students, Professors):** Rely on the App Manager to ensure they have the correct access to the system. |
| **Precondition(s)** | 1. The App Manager is authenticated into the AttendEase system with administrative privileges (UC-001). |
| **Postcondition(s)** | 1. The user account is successfully created, updated, or deactivated in the system.<br>2. Changes in user roles and permissions are reflected immediately. |
| **Flow of Events** | **Basic Flow (Add New User):**<br>1. App Manager navigates to the "User Management" section of the admin dashboard.<br>2. App Manager clicks "Add User."<br>3. App Manager enters the user's details (e.g., name, school ID, email) and selects their role.<br>4. App Manager saves the new user profile.<br>5. The system confirms the user has been created and is active. |

***

## Use Case ID: UC-006
## Use Case Name: Manage Course Data

| Field | Description |
| :--- | :--- |
| **Scenario** | At the beginning of a new term, an App Manager uploads or updates the course schedules, including class sections, student rosters, and professor assignments. |
| **Triggering Event** | A new academic term begins, requiring the system's schedule data to be updated. |
| **Brief Description** | This use case involves managing the academic data that underpins the system. The App Manager ensures that all courses, sections, and enrollments are correctly configured so that professors see the correct schedules and students appear in the correct classes. |
| **Actor(s)** | **Primary Actor(s):** App Manager<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** Professor, Student |
| **Related Use Case(s)** | Authenticate (UC-001) is included. |
| **Stakeholder(s)** | **App Manager:** Needs to ensure the academic data in the system is accurate and up-to-date.<br>**Professor:** Relies on this data to see their correct teaching schedule. |
| **Precondition(s)** | 1. The App Manager is authenticated into the AttendEase system (UC-001).<br>2. The official course and enrollment data for the new term is available. |
| **Postcondition(s)** | 1. The course and schedule data within AttendEase is updated to reflect the new academic term.<br>2. Professors and students are correctly associated with their assigned classes. |
| **Flow of Events** | **Basic Flow:**<br>1. App Manager navigates to the "Course Management" section.<br>2. App Manager selects the option to "Import New Term Data" or "Edit Existing Course."<br>3. To import, the App Manager uploads a formatted file (e.g., CSV) containing the course, section, professor, and student data.<br>4. The system validates the file and previews the changes.<br>5. App Manager confirms the import.<br>6. The system updates the database with the new course data. |

***

## Use Case ID: UC-007
## Use Case Name: Configure System Settings

| Field | Description |
| :--- | :--- |
| **Scenario** | An App Manager adjusts system-wide parameters to align with institutional policies or optimize performance. |
| **Triggering Event** | A policy change requires an update to system behavior (e.g., changing the time threshold for being marked 'Late'), or system performance needs tuning. |
| **Brief Description** | This use case allows the App Manager to control global settings for the AttendEase application. This could include setting the confidence score for facial recognition, defining attendance status rules, or configuring API integration parameters. |
| **Actor(s)** | **Primary Actor(s):** App Manager<br>**Supporting Actor(s):** None<br>**Offstage Actor(s):** None |
| **Related Use Case(s)** | Authenticate (UC-001) is included. |
| **Stakeholder(s)** | **App Manager:** Needs control over system parameters to ensure it functions according to institutional needs.<br>**All Users:** Are indirectly affected by these settings as they govern the application's behavior. |
| **Precondition(s)** | 1. The App Manager is authenticated into the AttendEase system (UC-001). |
| **Postcondition(s)** | 1. The system-wide settings are updated.<br>2. The changes are applied to all subsequent operations. |
| **Flow of Events** | **Basic Flow:**<br>1. App Manager navigates to the "System Settings" dashboard.<br>2. The system displays a list of configurable parameters (e.g., 'Late' Threshold, Facial Recognition Confidence Level).<br>3. App Manager modifies the value for a specific setting.<br>4. App Manager clicks "Save Changes."<br>5. The system validates and applies the new setting. |