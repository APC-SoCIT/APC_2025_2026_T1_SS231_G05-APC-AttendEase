import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import send from 'send';
import QRCode from 'qrcode';
import axios from 'axios';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Add JSON parsing middleware
app.use(express.json());

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : undefined,
  cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : undefined,
};

app.use("/static", express.static(path.join(__dirname, "static")));

// Adding tabs to our app. This will setup routes to various views
// Setup home page
app.get("/", (req, res) => {
  send(req, path.join(__dirname, "views", "hello.html")).pipe(res);
});

// Setup the static tab
app.get("/tab", (req, res) => {
  send(req, path.join(__dirname, "views", "hello.html")).pipe(res);
});

// Add role-based routing
app.get("/student", (req, res) => {
  // Student interface 
});

app.get("/professor", (req, res) => {
  send(req, path.join(__dirname, "views", "professor.html")).pipe(res);
});

// API endpoint to generate QR code
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { token, duration } = req.body;
    
    // Create QR code URL that points to scan endpoint
    const scanUrl = `http://localhost:3333/scan?token=${token}`;
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl);
    
    console.log(`\n=== QR CODE GENERATED ===`);
    console.log(`Token: ${token}`);
    console.log(`Duration: ${duration} minutes`);
    console.log(`Scan URL: ${scanUrl}`);
    console.log(`Generated at: ${new Date().toISOString()}`);
    console.log(`========================\n`);
    
    res.json({ qrCodeUrl: qrCodeDataUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Scan endpoint (simulates someone scanning the QR code)
app.get('/scan', (req, res) => {
  const { token } = req.query;
  
  // Generate device ID (simplified for prototype)
  const deviceId = generateDeviceId();
  
  // Log to professor's console (simulated)
  console.log(`\n=== DEVICE SCANNED QR CODE ===`);
  console.log(`Token: ${token}`);
  console.log(`Device ID: ${deviceId}`);
  console.log(`Scanned at: ${new Date().toISOString()}`);
  console.log(`==============================\n`);
  
  res.send(`
    <h1>QR Code Scanned Successfully!</h1>
    <p>Token: ${token}</p>
    <p>Device ID: ${deviceId}</p>
    <p>Check the professor's console for attendance data.</p>
  `);
});

// Simple device ID generator (for prototype)
function generateDeviceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `device_${timestamp}_${random}`;
}

// Facial Recognition API endpoints
const FACIAL_RECOGNITION_SERVICE_URL = 'http://localhost:5000';

// List available cameras
app.get('/api/facial-recognition/camera/list', async (req, res) => {
  try {
    const response = await axios.get(`${FACIAL_RECOGNITION_SERVICE_URL}/api/camera/list`);
    res.json(response.data);
  } catch (error) {
    console.error('Error listing cameras:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to list cameras' });
  }
});

// Check camera status
app.get('/api/facial-recognition/camera/status', async (req, res) => {
  try {
    const response = await axios.get(`${FACIAL_RECOGNITION_SERVICE_URL}/api/camera/status`);
    res.json(response.data);
  } catch (error) {
    console.error('Error checking camera status:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to check camera status' });
  }
});

// Start camera
app.post('/api/facial-recognition/camera/start', async (req, res) => {
  try {
    const response = await axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/camera/start`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error starting camera:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to start camera' });
  }
});

// Stop camera
app.post('/api/facial-recognition/camera/stop', async (req, res) => {
  try {
    const response = await axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/camera/stop`);
    res.json(response.data);
  } catch (error) {
    console.error('Error stopping camera:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to stop camera' });
  }
});

// Get current frame
app.get('/api/facial-recognition/camera/frame', async (req, res) => {
  try {
    const response = await axios.get(`${FACIAL_RECOGNITION_SERVICE_URL}/api/camera/frame`);
    res.json(response.data);
  } catch (error) {
    console.error('Error getting camera frame:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to get camera frame' });
  }
});

// Process frame from browser
app.post('/api/facial-recognition/process-frame', async (req, res) => {
  try {
    const response = await axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/process-frame`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error processing frame:', error.message);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to process frame';
    let statusCode = 500;
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Python facial recognition service is not running. Please start it with: python facial_recognition_service.py';
      statusCode = 503;
    } else if (error.response) {
      errorMessage = `Python service error: ${error.response.data?.message || error.response.statusText}`;
      statusCode = error.response.status;
    } else {
      errorMessage = `Connection error: ${error.message}`;
    }
    
    res.status(statusCode).json({ 
      status: 'error', 
      message: errorMessage,
      details: error.code || 'unknown_error'
    });
  }
});

// ============================================
// MICROSOFT GRAPH API CONFIGURATION
// ============================================

let graphClient = null;

// Initialize Graph Client if credentials are available
function initializeGraphClient() {
  const clientId = process.env.AAD_APP_CLIENT_ID || process.env.M365_CLIENT_ID;
  const clientSecret = process.env.AAD_APP_CLIENT_SECRET || process.env.M365_CLIENT_SECRET;
  const tenantId = process.env.AAD_APP_TENANT_ID || process.env.M365_TENANT_ID;

  if (clientId && clientSecret && tenantId) {
    try {
      const credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
      );

      graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
            return tokenResponse.token;
          }
        }
      });

      console.log('✅ Microsoft Graph API client initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Graph client:', error.message);
      return false;
    }
  } else {
    console.warn('⚠️ Graph API credentials not found. Online attendance tracking will not work.');
    console.warn('   Required env vars: AAD_APP_CLIENT_ID, AAD_APP_CLIENT_SECRET, AAD_APP_TENANT_ID');
    return false;
  }
}

// Check Graph API configuration status
app.get('/api/attendance/graph-status', (req, res) => {
  if (graphClient) {
    res.json({ status: 'configured', message: 'Graph API is ready' });
  } else {
    res.json({ status: 'not_configured', message: 'Graph API credentials not configured' });
  }
});

// Get online attendance from Teams meeting using Graph API
app.get('/api/attendance/online/:meetingId', async (req, res) => {
  try {
    if (!graphClient) {
      return res.status(503).json({
        status: 'error',
        message: 'Graph API not configured. Please check your environment variables.'
      });
    }

    const { meetingId } = req.params;
    console.log(`\n=== FETCHING ONLINE ATTENDANCE ===`);
    console.log(`Meeting ID: ${meetingId}`);

    try {
      // Get attendance reports for the meeting
      const attendanceReports = await graphClient
        .api(`/me/onlineMeetings/${meetingId}/attendanceReports`)
        .get();

      if (!attendanceReports.value || attendanceReports.value.length === 0) {
        console.log('No attendance reports found for this meeting yet.');
        return res.json({ 
          status: 'no_data', 
          students: [],
          message: 'No attendance data available. Meeting may not have started or ended yet.' 
        });
      }

      // Get the latest attendance report
      const latestReport = attendanceReports.value[0];
      const attendanceRecords = latestReport.attendanceRecords || [];

      console.log(`Found ${attendanceRecords.length} attendance record(s)`);

      // Format attendance data for frontend
      const onlineStudents = attendanceRecords.map(record => {
        const joinDateTime = record.attendanceIntervals?.[0]?.joinDateTime;
        const leaveDateTime = record.attendanceIntervals?.[0]?.leaveDateTime;
        
        return {
          name: record.identity?.displayName || 'Unknown',
          email: record.emailAddress,
          joinTime: joinDateTime,
          leaveTime: leaveDateTime,
          status: leaveDateTime ? 'left' : 'present',
          duration: record.totalAttendanceInSeconds,
          role: record.role
        };
      });

      console.log(`Returning ${onlineStudents.length} student(s)`);
      console.log(`===================================\n`);

      res.json({ 
        status: 'success', 
        students: onlineStudents,
        totalCount: onlineStudents.length
      });

    } catch (graphError) {
      console.error('Graph API Error:', graphError);
      
      if (graphError.statusCode === 404) {
        return res.status(404).json({
          status: 'error',
          message: 'Meeting not found or you do not have access to this meeting.'
        });
      } else if (graphError.statusCode === 403) {
        return res.status(403).json({
          status: 'error',
          message: 'Permission denied. Ensure the app has OnlineMeetings.Read permission.'
        });
      } else {
        return res.status(500).json({
          status: 'error',
          message: `Graph API error: ${graphError.message || 'Unknown error'}`,
          details: graphError.code
        });
      }
    }

  } catch (error) {
    console.error('Error fetching online attendance:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to fetch online attendance',
      details: error.code
    });
  }
});

// Initialize Graph API on startup
initializeGraphClient();

// ============================================
// END MICROSOFT GRAPH API CONFIGURATION
// ============================================

// Create HTTP server
const port = process.env.port || process.env.PORT || 3333;

if (sslOptions.key && sslOptions.cert) {
  https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}
