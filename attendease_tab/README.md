# AttendEase Tab

Facial recognition-based attendance system built as a Microsoft Teams Tab application.

## Quick Start

### Prerequisites

- **Node.js** 18, 20, or 22
- **Python** 3.11 or 3.12
- **cmake** (Linux/Mac only - required to compile dlib)

### Windows Setup

```batch
setup_dev.bat
```

After setup completes, activate the virtual environment:

```batch
venv\Scripts\activate
```

### Linux/Mac Setup

```bash
chmod +x setup_dev.sh
./setup_dev.sh
```

After setup completes, activate the virtual environment:

```bash
source venv/bin/activate
```

### Start the Application

With the virtual environment activated, run:

```bash
npm run dev
```

This single command starts all three services concurrently:
- **Python** - Facial recognition service (`facial_recognition_service.py`)
- **Backend** - Express.js server (`src/app.js`)
- **Frontend** - Vite dev server (React app)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all services (Python + Backend + Frontend) |
| `npm run dev:backend` | Start only the Express.js backend |
| `npm run dev:frontend` | Start only the Vite frontend |
| `npm run start:python` | Start only the facial recognition service |
| `npm run build` | Build the frontend for production |

## Project Structure

```
attendease_tab/
├── src/
│   ├── app.js              # Express.js server
│   ├── client/             # React frontend
│   ├── config/             # Azure & Supabase configs
│   ├── services/           # Backend services
│   └── static/             # Static assets
├── facial_recognition_service.py  # Python facial recognition API
├── photos/                 # Reference photos for facial recognition
├── setup_dev.bat           # Windows setup script
├── setup_dev.sh            # Linux/Mac setup script
└── requirements.txt        # Python dependencies
```

## Troubleshooting

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
