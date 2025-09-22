# AttendEase
Group leader: 
- Christian Luis Esguerra

Members:
- Moises James Sy
- Suzanne Marie Rosco
- Maria Sophea Balidio

## About AttendEase

AttendEase is a smart attendance system with facial recognition integration for Microsoft Teams. This system integrates Python facial recognition functionality into a web-based professor dashboard.

### System Architecture

The system consists of two main components:

1. **Python Facial Recognition Service** (`facial_recognition_service.py`) - Runs on port 5000
   - Handles camera access and facial recognition processing
   - Provides REST API endpoints for camera control
   - Returns processed video frames with face detection annotations

2. **Express.js Web Server** (`src/app.js`) - Runs on port 3333
   - Serves the web interface
   - Acts as a proxy to the Python service
   - Provides the `/professor` route with facial recognition interface

## Prerequisites

Before you begin working on the project, ensure you have the following installed:
*   **Microsoft 365 Agents Toolkit extension**

### For Facial Recognition System

#### Python Dependencies
```bash
pip install -r requirements.txt
```

Required packages:
- Flask (web service framework)
- flask-cors (Cross-Origin Resource Sharing)
- opencv-python (computer vision)
- face-recognition (facial recognition library)
- dlib (machine learning library)
- numpy (numerical computing)
- Pillow (image processing)

#### Node.js Dependencies
```bash
npm install
```

## Running the Project Locally (without Facial Recognition)

To run this project locally for development and testing:

1. **Navigate to the project folder**:
   ```bash
   cd attendease_basic_tab
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev:teamsfx
   ```

4. **Access the application**:
   - Open your browser and go to `http://localhost:3333`
   - For professor dashboard: `http://localhost:3333/professor`
   - For student interface: `http://localhost:3333/student`

The server will start on port 3333 and you should see "Express server listening on port 3333" in your terminal.

### Running with Facial Recognition

#### Option 1: Use the Startup Script (Recommended)
```bash
python start_services.py
```
This will start both services automatically.

#### Option 2: Manual Startup

1. **Start the Python service:**
```bash
python facial_recognition_service.py
```

2. **Start the Express server (in a new terminal):**
```bash
npm start
```

#### Usage

1. Open your browser and navigate to: `http://localhost:3333/professor`

2. The interface will show:
   - Camera status (Available/Not Available)
   - Control buttons (Start Camera, Stop Camera, Refresh Status)
   - Live video feed with face detection
   - List of detected faces with confidence scores

3. Click "Start Camera" to begin facial recognition

4. The system will:
   - Detect faces in real-time
   - Attempt to recognize known faces (Christian Esguerra, Moises Sy)
   - Show bounding boxes around detected faces
   - Display recognition confidence scores

## API Endpoints

### Python Service (port 5000)
- `GET /api/camera/status` - Check camera availability
- `POST /api/camera/start` - Start camera
- `POST /api/camera/stop` - Stop camera
- `GET /api/camera/frame` - Get current frame with annotations

### Express Server (port 3333)
- `GET /professor` - Professor dashboard with facial recognition
- `GET /api/facial-recognition/camera/*` - Proxy to Python service

## Face Recognition Data

To add more people:
1. Add their photo to the `photos/` directory
2. Update the `reference_people` list in `facial_recognition_service.py`

## Troubleshooting

### Camera Issues
- Ensure no other applications are using the camera
- Check camera permissions
- Try restarting the Python service

### Recognition Issues
- Ensure reference photos are clear and contain visible faces
- Check file paths in the `load_reference_data()` function
- Adjust the `TRACKING_THRESHOLD` for sensitivity

### Service Communication Issues
- Ensure both services are running
- Check that ports 3333 and 5000 are available
- Verify firewall settings

## System Messages

The interface shows real-time system messages including:
- Camera status updates
- Face detection events
- Error messages
- Service status changes

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
