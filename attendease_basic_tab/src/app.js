const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");
const send = require("send");
const QRCode = require('qrcode');
const axios = require('axios');

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
