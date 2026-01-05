# AttendEase
Group leader: 
- Christian Luis Esguerra

Members:
- Moises James Sy
- Suzanne Marie Rosco
- Maria Sophea Balidio

Refactor Branch

## About AttendEase

AttendEase is an **automated hybrid attendance system** designed for Asia Pacific College's **HyFlex learning model**. It seamlessly tracks both **online** and **onsite** student attendance during Microsoft Teams meetings.

### Key Features

-  **Onsite Attendance** - Real-time facial recognition using classroom cameras
-  **Online Attendance (post-meeting)** - Download Microsoft Teams attendance reports via Microsoft Graph
-  **Role-Based Access** - Automatic student/professor routing with email-domain validation inside Teams
-  **Admin Console (prototype)** - Launch admin controls from the professor dashboard with a modal login
-  **Report Generation** - Export combined attendance as CSV

---

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18 + Fluent UI + Vite |
| **Backend API** | Express.js (Node.js) |
| **Online Tracking** | Microsoft Graph API (post-meeting reports) |
| **Onsite Tracking** | Python + dlib + face_recognition |
| **Database** | Supabase  |

## Project Structure

```
attendease_tab/
├── python/                     # Python facial recognition service
│   ├── facial_recognition_service.py   # Flask API for face detection
│   ├── photos/                 # Reference photos for known faces
│   └── requirements.txt        # Python dependencies
├── scripts/                    # Development setup scripts
│   ├── setup_dev.bat           # Windows setup script
│   └── setup_dev.sh            # Linux/Mac setup script
├── src/                        # Node.js source code
│   ├── app.js                  # Express.js backend server
│   ├── client/                 # React frontend (components, styles)
│   ├── config/                 # Azure & Supabase configuration
│   ├── services/               # Backend services (auth, graph, supabase)
│   ├── static/                 # Static assets and scripts
│   └── utils/                  # Utility functions
├── appPackage/                 # Teams app manifest files
├── infra/                      # Azure infrastructure (Bicep templates)
├── env/                        # Environment configuration files
├── dist/                       # Production build output (generated)
├── public/                     # Public static files
├── .vscode/                    # VS Code settings and launch configs
├── package.json                # Node.js dependencies and scripts
├── vite.config.js              # Vite bundler configuration
├── index.html                  # Vite entry point
├── m365agents.yml              # Teams Toolkit configuration
└── m365agents.local.yml        # Teams Toolkit local dev config
```

## Prerequisites

Before running the app, ensure you have:

1. **Node.js** (v18, v20, or v22) - [Download](https://nodejs.org/)
2. **Python 3.11 or 3.12** - For facial recognition service
3. **cmake** (Linux/Mac only) - Required to compile dlib
4. **Microsoft 365 Account** - With Teams access
5. **Microsoft 365 Agents Toolkit** - VS Code extension installed
6. **Classroom Camera** - Logitech or compatible camera

## Quick Start - Local Development

### Step 1: Setup (First time only)

#### Windows Setup

```batch
cd attendease_tab
scripts\setup_dev.bat
```

```batch
npm install recharts jspdf jspdf-autotable
```

After setup completes, activate the virtual environment:

```batch
venv\Scripts\activate
```

This single command starts all three services concurrently:
- **Python** - Facial recognition service (`python/facial_recognition_service.py`) on port 5000
- **Backend** - Express.js server (`src/app.js`) on port 3333
- **Frontend** - Vite dev server (React app) on port 5173

### Alternative Windows Setup

#### Dlib Installation
```batch
https://github.com/z-mahmud22/Dlib_Windows_Python3.x
```

#### Python Setup
```batch
cd attendease_tab
pip install -r requirements.txt
```

#### Node.js Setup
```batch
cd attendease_tab
npm install
```
After Node.js Setup, install additional dependencies:
```batch
npm install recharts jspdf jspdf-autotable
```

#### Quick Start

On Terminal 1, run:
```bash
cd attendease_tab
npm start
```

On Terminal 2, run:
```bash
cd attendease_tab
npx vite
```

On Terminal 3, run:
```bash
cd attendease_tab
python facial_recognition_service.py
```

with this, all three services are running concurrently. Open your browser and go to:
- **Main App:** `http://localhost:5173/` (Landing page with Student/Professor options)
- **Student Portal:** `http://localhost:5173/student`
- **Professor Dashboard:** `http://localhost:5173/professor`

#### Linux/Mac Setup

```bash
cd attendease_tab
chmod +x scripts/setup_dev.sh
scripts/setup_dev.sh
```

After setup completes, activate the virtual environment:

```bash
source venv/bin/activate
```
 
### Step 2: Start the Application

With the virtual environment activated, run:

```bash
npm run dev
```

This single command starts all three services concurrently:
- **Python** - Facial recognition service (`python/facial_recognition_service.py`) on port 5000
- **Backend** - Express.js server (`src/app.js`) on port 3333
- **Frontend** - Vite dev server (React app) on port 5173

### Step 3: Access the Application

Open your browser and go to:
- **Main App:** `http://localhost:5173/` (Landing page with Student/Professor options)
- **Student Portal:** `http://localhost:5173/student`
- **Professor Dashboard:** `http://localhost:5173/professor`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all services (Python + Backend + Frontend) |
| `npm run dev:backend` | Start only the Express.js backend |
| `npm run dev:frontend` | Start only the Vite frontend |
| `npm run start:python` | Start only the facial recognition service |
| `npm run build` | Build the frontend for production |

### App Structure (React Router):
- **`/`** - Landing page with role selection (Student/Professor)
- **`/student`** - Student portal with profile information
- **`/professor`** - Professor dashboard with attendance tracking

### What Works Locally:
- ✅ React UI with Fluent UI components
- ✅ React Router navigation
- ✅ Landing page with Student/Professor options
- ✅ Student Portal (placeholder data)
- ✅ Facial recognition and camera detection
- ✅ Live video feed with face bounding boxes
- ✅ Onsite attendance tracking
- ✅ Role-based routing + professor dashboard
- ✅ Admin login modal and placeholder admin dashboard
- ✅ CSV export

### ⏸Not Available Locally (Requires Microsoft 365):
- ⏸️ Online attendance via Graph API (post-meeting report download)
- ⏸️ Teams integration
- ⏸️ HTTPS/SSL
- ⏸️ Real-time online attendance (Graph provides only post-meeting reports)

---

## How to Use During a HyFlex Class

### Before Class:

1. **Start Python service** in a terminal
2. **Start AttendEase** with F5 in VS Code
3. **Create/Join Teams Meeting** in Microsoft Teams
4. **Open AttendEase Tab** in the meeting

### During Class:

#### Track Online Students (Future Work):
1. After the Teams meeting ends, download the attendance report from the dashboard (Graph API post-meeting report).
2. For real-time online tracking, a Teams bot or new API will be required (under investigation).

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

### Express Backend (port 3333 in development)
- `GET /api/attendance/graph-status` - Check Graph API configuration
- `GET /api/attendance/online/:meetingId` - Get meeting attendance from Graph API
- `GET /api/facial-recognition/camera/status` - Check camera status
- `POST /api/facial-recognition/process-frame` - Process frame for face recognition

### Python Service (port 5000)
- `GET /api/camera/status` - Check camera availability
- `POST /api/process-frame` - Process image for face detection

##  Troubleshooting

### Windows: dlib installation fails

The setup script automatically installs a pre-compiled dlib wheel for Python 3.11 or 3.12. If you're using a different Python version, you may need to:
1. Install Visual Studio Build Tools
2. Or switch to Python 3.11/3.12

### Linux/Mac: dlib compilation fails

Make sure cmake is installed:
- **Ubuntu/Debian:** `sudo apt install cmake`
- **Fedora:** `sudo dnf install cmake`
- **Arch:** `sudo pacman -S cmake`
- **macOS:** `brew install cmake`

### 'python' command not found

On some systems, Python 3 is only available as `python3`. You can create an alias:

```bash
alias python=python3
```

Or update the `start:python` script in `package.json` to use `python3`.

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
1. Ensure Python service is running: `python python/facial_recognition_service.py`
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

### Local Development (3 Terminals - HTTP):
- **5000** - Python facial recognition service (Terminal 1)
- **3333** - Express backend (Terminal 2) - serves API and built React app
- **5173** - React frontend via Vite (Terminal 3) - proxies API calls to port 3333

### Production Build:
- **3333** - Express backend serves both API and built React app from `/dist`
- **5000** - Python facial recognition service

### Microsoft 365 Deployment (HTTPS - Future):
- **5000** - Python facial recognition service
- **53000** - Express backend (API + React build)
- **53001** - Vite dev server (development only)
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
