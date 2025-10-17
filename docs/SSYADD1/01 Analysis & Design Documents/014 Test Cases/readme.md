# 014 Test Cases

| Test Case # | Test Case Description | Test Data | Expected Result | Actual Result | Pass/Fail |
|-------------|----------------------|-----------|-----------------|---------------|-----------|
| 1 | Check response when entering school credentials on the Teams App. | Email:<br>Password: | Authentication successful | Goes to respective pages once logged in | Pass |
| 2 | Check response when the student enters their facial profile | Facial Profile Image | Students recognized | Image is saved onto database | Pass |
| 3 | Check data when Professor checks the Attendance Dashboard | Real-time Online and Onsite attendance Data | Data is being displayed | Only onsite attendance data is displayed | Fail |
| 4 | Check response when Professor exports an attendance report | Attendance History Data | Report is being exported | Report is being exported | Pass |
| 5 | Check response when Admin modifies user accounts | Add, Update, and Delete User Profiles | User Profiles are being created, updated, and deleted | No actual CRUD functionalities | Fail |
| 6 | Check response when Admin uploads or updates class schedules | Add and Update Class Schedule | Class Schedules are being created and updated | No actual CRUD functionalities | Fail |

---

## Notes
- **Actual Result** and **Pass/Fail** reflect the latest execution results after testing.
- These test cases cover **authentication, facial recognition, dashboard reporting, and admin functionalities**.
