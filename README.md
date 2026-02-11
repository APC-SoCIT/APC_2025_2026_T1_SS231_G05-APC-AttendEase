# AttendEase

**Automated hybrid attendance system** for Asia Pacific College's HyFlex learning model — tracks both **online** (via Microsoft Teams) and **onsite** (via facial recognition) student attendance.

**Team:**
- Christian Luis Esguerra (Lead)
- Moises James Sy
- Suzanne Marie Rosco
- Maria Sophea Balidio

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org/)
- **Python 3.11+** — [Download](https://www.python.org/downloads/)

### Step 1: Clone & Install

```bash
cd attendease_tab
npm install
```

### Step 2: Create Configuration File (REQUIRED)

Create a file named `.localConfigs` inside the `attendease_tab` folder with the following content:

```
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Important:** This file is NOT pushed to Git. Ask your team lead for the Supabase credentials.

### Step 3: Setup Python (First time only)

```bash
cd attendease_tab

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r python/requirements.txt
```

### Step 4: Run the App

**Linux/Mac:**
```bash
npm run dev
```

**Windows:**
```bash
npm run dev:win
```

This starts all three services:
- **Python** (port 5000) — Facial recognition
- **Backend** (port 3333) — Express.js API
- **Frontend** (port 5173) — React app

### Step 5: Open in Browser

- **Landing Page:** http://localhost:5173/
- **Professor Dashboard:** http://localhost:5173/professor
- **Student Portal:** http://localhost:5173/student

---

## Running in Microsoft Teams (Development)

To test the AttendEase app inside Microsoft Teams locally, you'll need to expose your localhost via **ngrok** (creates a public HTTPS tunnel).

### Prerequisites

- **Chocolatey** (Windows package manager) — or install ngrok manually
- **ngrok account** — Sign up free at https://dashboard.ngrok.com/signup

### Setup Steps

1. **Install Chocolatey** (Windows package manager):
   
   > **Note:** Chocolatey requires PowerShell to be run as Administrator
   
   - Open **PowerShell as Administrator** (right-click → "Run as Administrator")
   - Run this command:
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```
   - Then run:
     ```powershell
     [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
     ```
   - Verify installation:
     ```powershell
     choco --version
     ```

2. **Install ngrok** (also requires admin privileges):
   ```bash
   choco install ngrok
   ```

3. **Get your ngrok authtoken**:
   - Sign up at https://dashboard.ngrok.com/signup
   - Go to https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken and run:
     ```bash
     ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
     ```

4. **Start the app** (if not already running):
   ```bash
   npm run dev
   ```

5. **Start ngrok** in a new terminal:
   ```bash
   cd attendease_tab
   ngrok http 5173
   ```
   ngrok will display a public HTTPS URL like: `https://xxxx-xxxx-xxxx.ngrok-free.dev`

6. **Update the manifest** with your ngrok URL:
   - Open `attendease_tab/appPackage/manifest.json`
   - Replace all instances of the ngrok domain in:
     - `staticTabs[0].contentUrl`
     - `staticTabs[0].websiteUrl`
     - `validDomains[]`
   
   Example:
   ```json
   "staticTabs": [{
       "contentUrl": "https://xxxx-xxxx-xxxx.ngrok-free.dev/",
       "websiteUrl": "https://xxxx-xxxx-xxxx.ngrok-free.dev/",
       ...
   }],
   "validDomains": [
       "localhost",
       "xxxx-xxxx-xxxx.ngrok-free.dev"
   ]
   ```

7. **Create and upload the app to Teams**:
   - Zip the `attendease_tab/appPackage/` folder
   - In Microsoft Teams, go to **Apps** → **Manage your apps** → **Upload a custom app**
   - Select the zip file
   - Click **Add** to install in Teams

8. **Access the app**:
   - Find **AttendEase** in your Teams apps
   - Click to open and interact with it

### Important Notes

- **ngrok URL changes** each restart (unless you upgrade to paid plan) — update the manifest each time
- **Both services must run**: `npm run dev` (port 5173) and `ngrok` (tunnel to 5173)
- **Always use HTTPS** URLs in the manifest (ngrok provides this automatically)
- If the ngrok tunnel goes offline, restart ngrok and upload a new app zip with the updated URL
- **Icon files** (`color.png` and `outline.png`) must exist in `attendease_tab/public/`

---

## Troubleshooting

### "npm run dev" doesn't work?

Run each service manually in separate terminals:

**Terminal 1 — Python:**
```bash
cd attendease_tab
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac
python python/facial_recognition_service.py
```

**Terminal 2 — Backend:**
```bash
cd attendease_tab
npm start
```

**Terminal 3 — Frontend:**
```bash
cd attendease_tab
npx vite
```

### Python not found?

On some systems, use `python3` instead of `python`:
```bash
python3 -m venv venv
python3 python/facial_recognition_service.py
```

### First-time DeepFace download

- ArcFace model (~250MB) downloads automatically on first run (face recognition).
- OpenCV detector is used by default (fast, no downloads needed).
- Emotion model (for engagement) `facial_expression_model_weights.h5` can be downloaded manually to `~/.deepface/weights/` if auto-download fails on Windows:
  https://github.com/serengil/deepface_models/releases/download/v1.0/facial_expression_model_weights.h5

### Port already in use?

```powershell
# Windows — kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
```

---

## Project Structure

```
attendease_tab/
├── python/                    # Facial recognition service
│   ├── facial_recognition_service.py
│   ├── photos/                # Reference photos for face matching
│   └── requirements.txt
├── src/
│   ├── app.js                 # Express backend
│   ├── client/                # React components
│   ├── config/                # Supabase & Azure config
│   └── services/              # Backend services
├── .localConfigs              # Environment variables (CREATE MANUALLY)
├── package.json
└── vite.config.js
```

---

## Files You Must Create Manually

These files are **NOT in Git** and must be created locally:

| File | Location | Purpose |
|------|----------|---------|
| `.localConfigs` | `attendease_tab/` | Supabase URL and API keys |
| `venv/` | `attendease_tab/` | Python virtual environment |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all services (Linux/Mac) |
| `npm run dev:win` | Start all services (Windows) |
| `npm run dev:backend` | Backend only |
| `npm run dev:frontend` | Frontend only |
| `npm run start:python` | Python service only (Linux/Mac) |
| `npm run start:python:win` | Python service only (Windows) |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Fluent UI + Vite |
| Backend | Express.js |
| Database | Supabase |
| Facial Recognition | Python + DeepFace (ArcFace + OpenCV detector) |
| Online Attendance | Microsoft Graph API |

---

## Documentation

- [PRD.md](./docs/PRD.md) — Product Requirements Document
- [Technology Stack](./docs/SSYADD1/02%20Technology%20Stack%20Definition%20%26%20Implementation/) — Detailed documentation

---

## Commit Reference Table

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
