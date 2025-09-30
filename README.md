# AttendEase
Group leader: 
- Christian Luis Esguerra

Members:
- Moises James Sy
- Suzanne Marie Rosco
- Maria Sophea Balidio

## About AttendEase

AttendEase is an **automated hybrid attendance system** designed for Asia Pacific College's **HyFlex learning model**. It seamlessly tracks both **online** and **onsite** student attendance during Microsoft Teams meetings.

### Key Features

-  **Online Attendance** - Automatic tracking via Microsoft Graph API
-  **Onsite Attendance** - Real-time facial recognition using classroom cameras
-  **Unified Dashboard** - React + Fluent UI interface within Microsoft Teams
-  **Report Generation** - Export combined attendance as CSV
-  **Real-time Updates** - Live attendance tracking during class

---

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + Fluent UI + Vite |
| **Backend API** | Express.js (Node.js) |
| **Online Tracking** | Microsoft Graph API |
| **Onsite Tracking** | Python + dlib + face_recognition |
| **Database** | Supabase  |

## Prerequisites

Before running the app, ensure you have:

1. **Node.js** (v18, v20, or v22) - [Download](https://nodejs.org/)
2. **Python 3.8+** - For facial recognition service
3. **Microsoft 365 Account** - With Teams access
4. **Microsoft 365 Agents Toolkit** - VS Code extension installed
5. **Classroom Camera** - Logitech or compatible camera

### Install Python Dependencies

```bash
cd attendease_tab
pip install -r requirements.txt
```

**Required packages:**
- Flask, flask-cors
- opencv-python
- face-recognition, dlib
- numpy, Pillow

### Install Node.js Dependencies

```bash
cd attendease_tab
npm install
```

## Quick Start - Local Development (3 Terminals)

### Step 1: Install Dependencies (First time only)

```bash
cd attendease_tab
npm install
pip install -r requirements.txt
```

### Step 2: Open 3 Terminal Windows

You need **3 separate terminals** running at the same time:

#### **Terminal 1: Python Facial Recognition Service**

```bash
cd attendease_tab
python facial_recognition_service.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Running on all addresses (0.0.0.0)
```
**Keep this terminal open**

---

#### **Terminal 2: Express Backend**

```bash
cd attendease_tab
npm start
```

 **You should see:**
```
 Graph API credentials not found. Online attendance tracking will not work.
Express server listening on port 3333
```
*Note: The Graph API warning is normal for local development*

**Keep this terminal open**

---

#### **Terminal 3: React Frontend (Vite)**

```bash
cd attendease_tab
npx vite
```

**You should see:**
```
VITE v5.4.20  ready in 500ms
➜  Local:   http://localhost:5173/
```
**Keep this terminal open**

---

### Step 3: Access the Application

Open your browser and go to:
- **React Dashboard:** `http://localhost:5173`
- **Legacy Professor View:** `http://localhost:3333/professor`

### What Works Locally:
- ✅ React UI with Fluent UI components
- ✅ Facial recognition and camera detection
- ✅ Live video feed with face bounding boxes
- ✅ Onsite attendance tracking
- ✅ CSV export

### ⏸Not Available Locally (Requires Microsoft 365):
- ⏸️ Online attendance via Graph API (will show "not configured")
- ⏸️ Teams integration
- ⏸️ HTTPS/SSL

---

## How to Use During a HyFlex Class

### Before Class:

1. **Start Python service** in a terminal
2. **Start AttendEase** with F5 in VS Code
3. **Create/Join Teams Meeting** in Microsoft Teams
4. **Open AttendEase Tab** in the meeting

### During Class:

#### Track Online Students:
1. Click **"Start Tracking"** in the Online Attendance card
2. System polls Graph API every 10 seconds
3. Online students appear automatically as they join
4. See join times, duration, and status (present/left)

#### Track Onsite Students:
1. Select classroom camera from dropdown
2. Click **"Start Camera"**
3. Faces detected and identified in real-time
4. Confirmed students appear in Onsite Attendance list

#### View Combined Attendance:
- See total count in Summary card
- View breakdown: Online vs Onsite
- Real-time updates as students join/leave

### After Class:

1. Click **"Export Attendance Report (CSV)"**
2. Save CSV file with all attendance data
3. Open in Excel for record-keeping

---

##  API Endpoints

### Express Backend (port 53000)
- `GET /api/attendance/graph-status` - Check Graph API configuration
- `GET /api/attendance/online/:meetingId` - Get meeting attendance from Graph API
- `GET /api/facial-recognition/camera/status` - Check camera status
- `POST /api/facial-recognition/process-frame` - Process frame for face recognition

### Python Service (port 5000)
- `GET /api/camera/status` - Check camera availability
- `POST /api/process-frame` - Process image for face detection

##  Troubleshooting

### Issue: Graph API returns "Permission denied"

**Solution:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory → App Registrations
3. Find your app (`attendease_auth`)
4. Go to API Permissions
5. Add `OnlineMeetings.Read.All` permission
6. Click **"Grant admin consent"**

### Issue: "No meeting ID available"

**Solution:**
- Make sure you're opening the tab **during an active Teams meeting**
- The meeting must be started for meeting ID to be available
- Try refreshing the tab

### Issue: Facial recognition not working

**Solution:**
1. Ensure Python service is running: `python facial_recognition_service.py`
2. Check camera permissions in browser
3. Verify camera is not in use by another app
4. Check Python service logs for errors

### Issue: Port 53000 or 53001 already in use

**Solution:**
```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 53000).OwningProcess | Stop-Process
```

### Issue: SSL Certificate errors

**Solution:**
- Click "Advanced" → "Proceed anyway" in browser
- Or re-run provisioning to regenerate certificates

---

##  Microsoft Graph API Configuration

The Microsoft 365 Agents Toolkit automatically provisions an Azure AD app and configures Graph API access.

**Required Permissions:**
- `OnlineMeetings.Read.All` - To read meeting attendance
- `User.Read.All` - To read user information

**Environment Variables** (auto-generated in `.localConfigs`):
- `AAD_APP_CLIENT_ID`
- `AAD_APP_CLIENT_SECRET`
- `AAD_APP_TENANT_ID`

---

##  Success Indicators

You know it's working when:
- ✅ Graph API status shows "Connected ✓"
- ✅ Python service status shows "Running ✓"
- ✅ Online students appear automatically when they join meeting
- ✅ Camera shows live feed with face bounding boxes
- ✅ Attendance summary updates in real-time
- ✅ CSV export contains both online and onsite students

---

##  Documentation

- **[Documentation Folder](./docs/)** - Overall Documentation of the Project
- **[PRD.md](./docs/PRD.md)** - Product Requirements Document with technical specifications
- **[Technology Stack](./docs/SSYADD1/02%20Technology%20Stack%20Definition%20%26%20Implementation/)** - Detailed tech stack documentation

---

##  Ports Reference

### Local Development (3 Terminals):
- **5000** - Python facial recognition service (Terminal 1)
- **3333** - Express backend (Terminal 2)
- **5173** - React frontend via Vite (Terminal 3)

### Production (Microsoft 365 Deployment):
- **5000** - Python facial recognition service
- **53000** - Express backend (API)
- **53001** - React frontend (Vite dev server)
- **9239** - Node.js debugger

---

##  Graph API Data Structure

When online students join, Graph API returns:

```json
{
  "status": "success",
  "students": [
    {
      "name": "John Doe",
      "email": "john.doe@apc.edu.ph",
      "joinTime": "2024-01-15T10:00:00Z",
      "leaveTime": null,
      "status": "present",
      "duration": 1800,
      "role": "Attendee"
    }
  ]
}
```

---


### Commit Reference Table

| Type       | Description                                                                 | Example Subject                                           |
| :--------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------- |
| `feat`     | A **new feature** for the user.                                             | `feat(auth): Add user registration flow`                  |
| `fix`      | A **bug fix**.                                                              | `fix(modal): Correct z-index issue`                       |
| `docs`     | **Documentation only changes**.                                             | `docs: Update README with setup guide`                    |
| `style`    | Changes that do not affect the meaning of the code (whitespace, formatting).| `style: Apply Prettier formatting`                        |
| `refactor` | A code change that neither fixes a bug nor adds a feature (e.g., renaming). | `refactor(utils): Extract validation logic`               |
| `test`     | Adding missing **tests** or correcting existing tests.                      | `test: Add unit tests for API client`                     |
| `chore`    | Other changes that don't modify src or test files (e.g., dependency updates).| `chore: Update Node.js version in CI`                     |
| `build`    | Changes that affect the **build system** or external dependencies.          | `build: Configure Webpack for production`                 |
| `ci`       | Changes to **CI configuration** files and scripts.                          | `ci: Add E2E tests to workflow`                           |
| `perf`     | A code change that **improves performance**.                                | `perf: Optimize database query`                           |
| `revert`   | **Reverts** a previous commit.                                              | `revert: feat: Add experimental feature X`                |
| `security` | Fixes related to **vulnerabilities** or security patches.                   | `security(auth): Fix JWT token leak`                      |
| `hotfix`   | An **urgent fix** applied to production (alternative to `fix`).             | `hotfix(api): Patch crash in payment gateway`             |
| `merge`    | A commit created by **merging branches**.                                   | `merge: branch 'feature/login' into 'main'`               |
