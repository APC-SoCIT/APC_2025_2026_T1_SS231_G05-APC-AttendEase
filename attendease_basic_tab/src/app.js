const express = require("express");
const fs = require("fs");
const https = require("https");
const path = require("path");
const send = require("send");
const QRCode = require('qrcode');

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
