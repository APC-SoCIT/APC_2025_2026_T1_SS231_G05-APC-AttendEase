# 031 PM Docs Chapter 2

This document outlines the foundational project management aspects and objectives for the AttendEase project.

## Project Charter

**AttendEase Purpose**
The current methods for tracking student attendance at Asia Pacific College (APC) are manual, time-consuming, and inefficient for the HyFlex (hybrid-flexible) learning model. This project aims to automate the process to save time, reduce errors, and provide better insights into student participation.

**High-level project description**
AttendEase is a smart attendance system integrated directly into Microsoft Teams, the platform currently used by APC. It will use facial recognition via existing classroom cameras to track in-person students and will leverage the MS Teams bot and API to log attendance for online participants. All data will be consolidated into a centralized, real-time dashboard for professors and administrators to view attendance and generate reports.

**High-level milestone schedule**
The project is planned across several academic terms with the following milestones:
- Year 2, Term 3: Project planning, documentation, initial research, and prototype designs.
- Year 3, Term 1: Core development of the facial recognition module and Teams bot integration.
- Year 3, Term 2: Backend development, dashboard creation, and system testing.
- Year 3, Term 3: Bug fixes, pilot testing, and full deployment.

**Rough cost estimate and budget**
For the project, we will use open source and readily available tools to not utilize many costs in developing the system. However, in-case we would need to purchase software/hardware, we will have a ₱1,000 budget that each member of the group will fund equally to get the total of ₱1,000.

**Stakeholders**
- APC Faculty
- APC Students
- APC IT Department
- Project manager : Christian Luis Esguerra, Lead Developer/Project Manager
- Sponsor Name : Jose Eugenio Quesada, Project-Based Learning Instructor

**Project manager’s responsibilities**
The project manager is responsible for leading the development of facial recognition and dashboard features, managing the project's documentation, overseeing the final demo, and ensuring project milestones are met.

**Project manager’s authority**
The project manager has the authority to assign tasks to the development team and guide the technical direction of the project. Authority regarding budget and final institutional sign-off resides with the Project Advisor and APC administration.

**Formal declaration of sponsor’s support**
Project Title: AttendEase
Sponsor Name: Jose Eugenio Quesada
Position/Title: Project-Based Learning Instructor
Organization: APC
I, Jose Eugenio Quesada, formally express my full support for the AttendEase initiative. I acknowledge my role as the Project Sponsor and confirm my commitment to providing strategic direction and oversight, ensuring necessary resources, facilitating decision-making, and championing the project’s objectives.

## AttendEase Objectives

The following represents the core drivers and goals for the AttendEase project, based on discussions with project stakeholders and an analysis of the academic environment at Asia Pacific College (APC). Current attendance tracking methods in APC's HyFlex learning environment are largely manual, creating a significant administrative burden on faculty and disrupting the flow of instruction. These outdated approaches are time-consuming and inefficient, especially when needing to combine records for both in-person and online students. Instructors and administrators lack a unified, real-time view of attendance data, making it difficult to monitor student participation effectively and generate accurate reports. Furthermore, there is no system to integrate existing classroom cameras with Microsoft Teams for a truly automated solution, nor is there a mechanism to monitor the engagement levels of students during class sessions.

**Categorized Objectives**
- Automation & Efficiency: To develop and deploy an automated attendance system that accurately records both in-person and online students in real-time without disrupting class, by the end of Year 3, Term 3. The system is fully deployed and can accurately record attendance for a full class session with no manual input required from the professor.
- Data & Reporting: To create a centralized, user-friendly dashboard by the second month of Year 3, Term 3, that gives professors and administrators real-time access to attendance records and automatically generates reports. The dashboard is accessible to authorized users and can successfully generate a consolidated attendance report within 5 minutes of a class session ending.
- Technical Integration & Compliance: To fully integrate AttendEase with APC’s existing classroom cameras and Microsoft Teams platform by the end of Year 3, Term 3, ensuring compliance with data privacy policies. The system operates seamlessly within the MS Teams environment, utilizes existing hardware, and passes a review for compliance with institutional data privacy standards.
- Feature Expansion: To implement a visual-based engagement monitoring system for onsite classes that can identify behavioral cues (e.g., facial orientation, hand-raising) by the end of Year 3, Term 3. The system can successfully detect and log predefined engagement cues during a test session, providing data beyond simple presence.

## Scope Statement

**Project goal and objectives**

Goal:
The primary goal is to enhance operational efficiency at APC by developing an automated attendance and engagement tracking system. This system will replace manual, error-prone methods with a seamless, integrated solution within Microsoft Teams.

Objectives:
1. Automate Attendance Tracking
    - Develop an automated system that accurately records student attendance in real-time for both in-person and online participants in HyFlex classes without requiring manual input or disrupting instructional flow
2. Create Unified Dashboard
    - Implement a centralized, user-friendly dashboard that enables professors and administrators to access real-time attendance records and automatically generate attendance reports with data consolidation from both physical and virtual sessions
3. Integrate with Existing Infrastructure
    - Fully integrate AttendEase with APC's existing classroom camera infrastructure and Microsoft Teams platform while ensuring compliance with institutional data privacy policies and enabling scalability for future expansion
4. Implement Engagement Monitoring
    - Deploy a visual-based engagement monitoring system that can verify and validate student engagement levels during onsite classes using observable behavioral cues (e.g., facial orientation, hand-raising, signs of inattentiveness)

**Project Boundaries**
- Within scope: Automated Tracking (Facial recognition for in-person students and MS Teams API integration for online students), Centralized Dashboard (a unified dashboard within MS Teams for professors and administrators), Engagement Monitoring (tracking online participation and observable onsite physical cues), and Integration (the system is designed for APC's HyFlex environment using existing Logitech cameras and the MS Teams platform).
- Out of scope: The system will not support other video conferencing platforms like Zoom or Google Meet, will not evaluate the quality or substance of student contributions (Qualitative Analysis), and will not include direct integration with grading systems or payment gateways.

**Project Deliverables**
- AttendEase v1.0.0 (Pilot Release): A functional Alpha prototype of the Microsoft Teams application.
- Core Modules: A working facial recognition module and a module for integrating with the MS Teams Insights API.
- User Interface: A unified dashboard for viewing consolidated attendance data.
- Documentation: A final report that includes all project documentation, from planning to testing results.

**Success Criteria**
The system improves the accuracy of attendance records for both online and in-person students. The time spent by faculty on taking attendance is significantly reduced. The final Alpha prototype is delivered feature-complete and signed off by the project advisor. Pilot users (faculty) provide positive feedback on the system's usability and effectiveness.

**Project Assumptions**
- Existing classroom cameras are of sufficient quality and are positioned correctly for reliable facial recognition.
- The Microsoft Teams Graph API will remain available and stable throughout the project lifecycle.
- Students will provide consent for facial data registration as it is a required component for attendance.
- APC IT will provide the necessary permissions and support for app deployment within the institutional Teams environment.

**Project Constraints**
- Timeline: The project must be completed and deployed by the end of Year 3, Term 3
- Hardware Dependency: The system's accuracy is dependent on variable classroom conditions like lighting and camera angles.
- Privacy: The project must strictly adhere to institutional policies regarding the secure handling of student biometric data.

## Use Cases

The following use cases detail the interactions within the AttendEase system:

*   **UC-001 Authenticate**: User logs into the system.
*   **UC-002 Manage Facial Profile**: Student registers or updates facial data.
*   **UC-003 View Attendance Dashboard**: Professor monitors real-time attendance.
*   **UC-004 Generate Attendance Report**: Professor creates attendance reports.
*   **UC-005 Manage User Accounts**: App Manager provisions/modifies/deactivates accounts.
*   **UC-006 Manage Course Data**: App Manager updates course schedules and rosters.
*   **UC-007 Configure System Settings**: App Manager adjusts system parameters.
