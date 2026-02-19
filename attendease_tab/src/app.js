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

// Supabase services
import { supabase, testSupabaseConnection } from './config/supabase.config.js';
import sessionService from './services/supabase/sessionService.js';
import attendanceService from './services/supabase/attendanceService.js';
import courseService from './services/supabase/courseService.js';
import studentService from './services/supabase/studentService.js';

// Utilities
import { generateAttendanceCSV, generateAttendanceSummary, generateBulkSummary } from './utils/exportHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Add JSON parsing middleware with increased limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const sslOptions = {
  key: process.env.SSL_KEY_FILE ? fs.readFileSync(process.env.SSL_KEY_FILE) : undefined,
  cert: process.env.SSL_CRT_FILE ? fs.readFileSync(process.env.SSL_CRT_FILE) : undefined,
};

app.use("/static", express.static(path.join(__dirname, "static")));

// Serve React build in production
const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('✅ Serving React app from /dist');
}

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
let processFrameProxyCount = 0;

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

// Check camera status (uses fast health check)
app.get('/api/facial-recognition/camera/status', async (req, res) => {
  try {
    // Use health endpoint for faster response (doesn't enumerate cameras)
    const response = await axios.get(`${FACIAL_RECOGNITION_SERVICE_URL}/api/health`, {
      timeout: 3000 // 3 second timeout
    });
    res.json(response.data);
  } catch (error) {
    // Fallback to camera status if health check fails
    try {
      const response = await axios.get(`${FACIAL_RECOGNITION_SERVICE_URL}/api/camera/status`, {
        timeout: 3000
      });
      res.json(response.data);
    } catch (fallbackError) {
      console.error('Error checking camera status:', error.message);
      res.status(500).json({ status: 'error', message: 'Failed to check camera status' });
    }
  }
});

// Get Python debug status via backend proxy
app.get('/api/facial-recognition/debug/status', async (req, res) => {
  try {
    const response = await axios.get(`${FACIAL_RECOGNITION_SERVICE_URL}/api/debug/status`, {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching debug status:', error.message);
    const statusCode = error.response?.status || (error.code === 'ECONNREFUSED' ? 503 : 500);
    res.status(statusCode).json({
      status: 'error',
      message: error.response?.data?.message || `Failed to fetch debug status: ${error.message}`,
      details: error.code || 'unknown_error'
    });
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
  processFrameProxyCount += 1;
  const shouldTrace = processFrameProxyCount <= 5 || processFrameProxyCount % 30 === 0;
  if (shouldTrace) {
    const payloadSize = req?.body?.frame?.length || 0;
    console.log(`[FrameTrace][Proxy] recv #${processFrameProxyCount} payload=${payloadSize}`);
  }

  try {
    const response = await axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/process-frame`, req.body);
    if (shouldTrace) {
      const faces = response.data?.detected_faces?.length ?? response.data?.total_faces ?? 0;
      const faceNames = (response.data?.detected_faces || []).map(f => `${f.name}(${(f.confidence*100).toFixed(0)}%)`).join(', ');
      const dbg = response.data?._debug || {};
      console.log(
        `[FrameTrace][Proxy] fwd_ok #${processFrameProxyCount} faces=${faces} names=[${faceNames}] idCalls=${dbg.identify_calls || 0} vecCache=${dbg.vectors_cached || '?'}`
      );
    }
    res.json(response.data);
  } catch (error) {
    console.error('Error processing frame:', error.message);
    if (shouldTrace) {
      console.log(
        `[FrameTrace][Proxy] fwd_fail #${processFrameProxyCount} code=${error.code || 'n/a'} status=${error.response?.status || 'n/a'}`
      );
    }
    
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

// Clear Python face trackers
app.post('/api/facial-recognition/clear-trackers', async (req, res) => {
  try {
    const response = await axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/clear-trackers`);
    res.json(response.data);
  } catch (error) {
    console.error('Error clearing trackers:', error.message);
    const statusCode = error.response?.status || (error.code === 'ECONNREFUSED' ? 503 : 500);
    res.status(statusCode).json({
      status: 'error',
      message: error.response?.data?.message || `Failed to clear trackers: ${error.message}`,
      details: error.code || 'unknown_error'
    });
  }
});

// Refresh Python face vector cache (called after enrollment)
app.post('/api/facial-recognition/refresh-vectors', async (req, res) => {
  try {
    const response = await axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/refresh-vectors`, null, {
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error refreshing face vectors:', error.message);
    const statusCode = error.response?.status || (error.code === 'ECONNREFUSED' ? 503 : 500);
    res.status(statusCode).json({
      status: 'error',
      message: error.response?.data?.message || `Failed to refresh face vectors: ${error.message}`,
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

// ---- Delegated Graph API Proxy Endpoints ----
// These use a Graph Explorer access token passed in the Authorization header.

// Verify a delegated token by calling GET /me
app.get('/api/graph/delegated/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing Bearer token in Authorization header' });
    }

    const meResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: authHeader }
    });

    return res.json({
      status: 'success',
      user: {
        displayName: meResponse.data.displayName,
        mail: meResponse.data.mail || meResponse.data.userPrincipalName,
        id: meResponse.data.id
      }
    });
  } catch (error) {
    console.error('Token verification error:', error?.response?.data || error.message);
    const statusCode = error?.response?.status || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error?.response?.data?.error?.message || 'Token verification failed'
    });
  }
});

// List professor's online meetings via delegated token
app.get('/api/graph/delegated/meetings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing Bearer token in Authorization header' });
    }

    let meetings = [];
    let discoveryMessage = null;

    try {
      // Fast path: list meetings directly.
      // Some tenants support this endpoint as-is.
      const meetingsUrl = 'https://graph.microsoft.com/v1.0/me/onlineMeetings';
      const meetingsResponse = await axios.get(meetingsUrl, {
        headers: { Authorization: authHeader }
      });

      meetings = (meetingsResponse.data?.value || []).map(m => ({
        id: m.id,
        subject: m.subject || '(No subject)',
        startDateTime: m.startDateTime,
        endDateTime: m.endDateTime,
        joinUrl: m.joinWebUrl,
        createdDateTime: m.creationDateTime
      }));
    } catch (directListError) {
      const graphError = directListError?.response?.data?.error || {};
      const requiresFilter = graphError.code === 'InvalidArgument'
        && typeof graphError.message === 'string'
        && graphError.message.includes('Filter expression expected');

      if (!requiresFilter) {
        throw directListError;
      }

      // Fallback path for tenants where /me/onlineMeetings requires $filter:
      // 1) list meeting chats
      // 2) resolve each chat's joinWebUrl into /me/onlineMeetings?$filter=JoinWebUrl eq '...'
      try {
        const chatsUrl = 'https://graph.microsoft.com/beta/me/chats?$filter=chatType eq \'meeting\'&$select=id,topic,createdDateTime,onlineMeetingInfo';
        const chatsResponse = await axios.get(chatsUrl, {
          headers: { Authorization: authHeader }
        });

        const chats = chatsResponse.data?.value || [];
        const meetingMap = new Map();

        await Promise.all(chats.map(async (chat) => {
          const joinUrl = chat?.onlineMeetingInfo?.joinWebUrl;
          const conferenceId = chat?.onlineMeetingInfo?.conferenceId;
          if (!joinUrl && !conferenceId) {
            return;
          }

          // Try multiple filter candidates because some tenants only resolve
          // one specific parameter name.
          const filterCandidates = [];
          if (conferenceId) {
            filterCandidates.push(`VideoTeleconferenceId eq '${conferenceId}'`);
          }
          if (joinUrl) {
            const escapedJoinUrl = joinUrl.replace(/'/g, "''");
            filterCandidates.push(`JoinWebUrl eq '${escapedJoinUrl}'`);
          }

          let match = null;
          for (const filterExpr of filterCandidates) {
            const lookupUrl = `https://graph.microsoft.com/v1.0/me/onlineMeetings?$filter=${encodeURIComponent(filterExpr)}`;
            try {
              const lookupResponse = await axios.get(lookupUrl, {
                headers: { Authorization: authHeader }
              });
              match = lookupResponse.data?.value?.[0] || null;
              if (match) break;
            } catch (lookupError) {
              console.warn('Meeting lookup failed:', lookupError?.response?.data?.error?.message || lookupError.message);
            }
          }

          if (!match) {
            return;
          }

          meetingMap.set(match.id, {
            id: match.id,
            subject: match.subject || chat.topic || '(No subject)',
            startDateTime: match.startDateTime,
            endDateTime: match.endDateTime,
            joinUrl: match.joinWebUrl,
            createdDateTime: match.creationDateTime || chat.createdDateTime,
            chatId: chat.id
          });
        }));

        meetings = Array.from(meetingMap.values());
      } catch (chatDiscoveryError) {
        const chatStatus = chatDiscoveryError?.response?.status;
        const chatMessage = chatDiscoveryError?.response?.data?.error?.message || chatDiscoveryError.message;
        const missingChatScope = chatStatus === 403 && /Chat\.ReadBasic|Chat\.Read|Chat\.ReadWrite/.test(chatMessage || '');

        if (missingChatScope) {
          // Don't fail the whole endpoint; frontend can use manual meeting input fallback.
          meetings = [];
          discoveryMessage = 'Meeting auto-discovery is limited because this token lacks Chat.Read. You can still fetch attendance by entering a meeting ID or Join URL manually.';
        } else {
          throw chatDiscoveryError;
        }
      }
    }

    // Sort newest first
    meetings.sort((a, b) => new Date(b.startDateTime || b.createdDateTime || 0) - new Date(a.startDateTime || a.createdDateTime || 0));

    return res.json({
      status: 'success',
      meetings,
      totalCount: meetings.length,
      message: discoveryMessage
    });
  } catch (error) {
    console.error('List meetings error:', error?.response?.data || error.message);
    const statusCode = error?.response?.status || 500;
    const graphMessage = error?.response?.data?.error?.message;
    const helpMessage = statusCode === 403
      ? 'Failed to list meetings. Ensure delegated permissions include Chat.Read and OnlineMeetings.Read.'
      : 'Failed to list meetings';
    return res.status(statusCode).json({
      status: 'error',
      message: graphMessage || helpMessage
    });
  }
});

// Resolve a meeting from a known Join URL or conference ID using filtered lookup.
// Useful when tenant restrictions block /me/onlineMeetings listing and chat scopes are missing.
app.get('/api/graph/delegated/resolve-meeting', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing Bearer token in Authorization header' });
    }

    const joinWebUrlRaw = req.query.joinWebUrl;
    const videoTeleconferenceIdRaw = req.query.videoTeleconferenceId;
    const joinWebUrl = typeof joinWebUrlRaw === 'string' ? joinWebUrlRaw.trim() : '';
    const videoTeleconferenceId = typeof videoTeleconferenceIdRaw === 'string' ? videoTeleconferenceIdRaw.trim() : '';

    if (!joinWebUrl && !videoTeleconferenceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Provide joinWebUrl or videoTeleconferenceId as query parameter.'
      });
    }

    const filterCandidates = [];
    if (videoTeleconferenceId) {
      filterCandidates.push(`VideoTeleconferenceId eq '${videoTeleconferenceId}'`);
    }
    if (joinWebUrl) {
      const escapedJoinUrl = joinWebUrl.replace(/'/g, "''");
      filterCandidates.push(`JoinWebUrl eq '${escapedJoinUrl}'`);
    }

    let meeting = null;
    for (const filterExpr of filterCandidates) {
      const lookupUrl = `https://graph.microsoft.com/v1.0/me/onlineMeetings?$filter=${encodeURIComponent(filterExpr)}`;
      const lookupResponse = await axios.get(lookupUrl, {
        headers: { Authorization: authHeader }
      });
      const candidate = lookupResponse.data?.value?.[0];
      if (candidate) {
        meeting = candidate;
        break;
      }
    }

    if (!meeting) {
      return res.json({
        status: 'no_data',
        message: 'No matching meeting was found for the provided value.'
      });
    }

    return res.json({
      status: 'success',
      meeting: {
        id: meeting.id,
        subject: meeting.subject || '(No subject)',
        startDateTime: meeting.startDateTime,
        endDateTime: meeting.endDateTime,
        joinUrl: meeting.joinWebUrl,
        createdDateTime: meeting.creationDateTime
      }
    });
  } catch (error) {
    console.error('Resolve meeting error:', error?.response?.data || error.message);
    const statusCode = error?.response?.status || 500;
    return res.status(statusCode).json({
      status: 'error',
      message: error?.response?.data?.error?.message || 'Failed to resolve meeting'
    });
  }
});

// Get attendance report for a specific meeting via delegated token
app.get('/api/graph/delegated/online/:meetingId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing Bearer token in Authorization header' });
    }

    const { meetingId } = req.params;

    const reportsUrl = `https://graph.microsoft.com/v1.0/me/onlineMeetings/${encodeURIComponent(meetingId)}/attendanceReports`;
    const reportsResponse = await axios.get(reportsUrl, {
      headers: { Authorization: authHeader }
    });

    const reports = reportsResponse.data?.value || [];

    if (reports.length === 0) {
      return res.json({
        status: 'no_data',
        students: [],
        message: 'No attendance reports available yet for this meeting.'
      });
    }

    // Get the latest attendance report with expanded records
    const latestReportId = reports[0].id;
    const reportUrl = `https://graph.microsoft.com/v1.0/me/onlineMeetings/${encodeURIComponent(meetingId)}/attendanceReports/${encodeURIComponent(latestReportId)}?$expand=attendanceRecords`;
    const reportResponse = await axios.get(reportUrl, {
      headers: { Authorization: authHeader }
    });

    const report = reportResponse.data;
    const attendanceRecords = report?.attendanceRecords || [];
    const meetingStartTime = report?.meetingStartDateTime;
    const meetingEndTime = report?.meetingEndDateTime;

    // Calculate total meeting duration in seconds
    let meetingDurationSeconds = 0;
    if (meetingStartTime && meetingEndTime) {
      meetingDurationSeconds = (new Date(meetingEndTime) - new Date(meetingStartTime)) / 1000;
    }

    const students = attendanceRecords.map(record => {
      const joinDateTime = record.attendanceIntervals?.[0]?.joinDateTime;
      const leaveDateTime = record.attendanceIntervals?.[record.attendanceIntervals.length - 1]?.leaveDateTime;

      // Compute engagement score as % of meeting attended
      const durationSeconds = record.totalAttendanceInSeconds || 0;
      let engagementScore = 0;
      if (meetingDurationSeconds > 0) {
        engagementScore = Math.min(100, Math.round((durationSeconds / meetingDurationSeconds) * 100));
      }

      return {
        name: record.identity?.displayName || 'Unknown',
        email: record.emailAddress,
        joinTime: joinDateTime,
        leaveTime: leaveDateTime,
        status: leaveDateTime ? 'left' : 'present',
        duration: durationSeconds,
        role: record.role,
        engagementScore
      };
    });

    return res.json({
      status: 'success',
      students,
      totalCount: students.length,
      meetingStartTime,
      meetingEndTime,
      meetingDurationSeconds
    });
  } catch (error) {
    console.error('Delegated Graph proxy error:', error?.response?.data || error.message);
    const statusCode = error?.response?.status || 500;
    const message = error?.response?.data?.error?.message || error.message || 'Graph API error';
    return res.status(statusCode).json({
      status: 'error',
      message
    });
  }
});

// Save online attendance records to Supabase
app.post('/api/attendance/online/save', async (req, res) => {
  try {
    const { sessionId, students, meetingSubject, meetingStartTime, meetingEndTime } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ status: 'error', message: 'students array is required' });
    }

    const savedRecords = [];
    const errors = [];

    for (const student of students) {
      try {
        // Try to find the student by email in user_profiles
        let studentId = null;
        if (student.email) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('email', student.email)
            .single();
          if (profile) studentId = profile.user_id;
        }

        const record = {
          session_id: sessionId || null,
          student_id: studentId,
          attendance_type: 'online',
          check_in_time: student.joinTime || new Date().toISOString(),
          status: 'present',
          confidence_score: student.engagementScore || null,
          notes: JSON.stringify({
            source: 'graph_api',
            meeting_subject: meetingSubject || null,
            meeting_start: meetingStartTime || null,
            meeting_end: meetingEndTime || null,
            display_name: student.name,
            email: student.email,
            join_time: student.joinTime,
            leave_time: student.leaveTime,
            duration_seconds: student.duration,
            engagement_score: student.engagementScore,
            role: student.role,
            // CSV enrichment fields (if present)
            camera_duration: student.cameraDuration || null,
            hand_raise_count: student.handRaiseCount || null,
            reaction_count: student.reactionCount || null
          })
        };

        const { data, error } = await supabase
          .from('attendance_records')
          .insert(record)
          .select()
          .single();

        if (error) throw error;
        savedRecords.push(data);
      } catch (err) {
        errors.push({ student: student.email || student.name, error: err.message });
      }
    }

    console.log(`✅ Saved ${savedRecords.length} online attendance records (${errors.length} errors)`);

    return res.json({
      status: 'success',
      savedCount: savedRecords.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error saving online attendance:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Save CSV-parsed engagement data to Supabase
app.post('/api/attendance/online/upload-csv', async (req, res) => {
  try {
    const { sessionId, students, meetingSubject } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ status: 'error', message: 'students array is required' });
    }

    const savedRecords = [];
    const errors = [];

    for (const student of students) {
      try {
        // Try to find the student by email in user_profiles
        let studentId = null;
        if (student.email) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('email', student.email)
            .single();
          if (profile) studentId = profile.user_id;
        }

        const record = {
          session_id: sessionId || null,
          student_id: studentId,
          attendance_type: 'online',
          check_in_time: student.joinTime || new Date().toISOString(),
          status: 'present',
          confidence_score: student.engagementScore || null,
          notes: JSON.stringify({
            source: 'teams_csv_upload',
            meeting_subject: meetingSubject || null,
            display_name: student.fullName,
            email: student.email,
            join_time: student.joinTime,
            leave_time: student.leaveTime,
            duration_seconds: student.durationSeconds,
            in_meeting_duration_seconds: student.inMeetingDurationSeconds,
            camera_duration_seconds: student.cameraDurationSeconds,
            hand_raise_count: student.handRaiseCount,
            reaction_count: student.reactionCount,
            role: student.role,
            engagement_score: student.engagementScore
          })
        };

        const { data, error } = await supabase
          .from('attendance_records')
          .insert(record)
          .select()
          .single();

        if (error) throw error;
        savedRecords.push(data);
      } catch (err) {
        errors.push({ student: student.email || student.fullName, error: err.message });
      }
    }

    console.log(`✅ Saved ${savedRecords.length} CSV attendance records (${errors.length} errors)`);

    return res.json({
      status: 'success',
      savedCount: savedRecords.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error saving CSV attendance:', error);
    return res.status(500).json({ status: 'error', message: error.message });
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

// ---- Teams SDK SSO → OBO Token Exchange (Stretch Goal) ----
// When the app runs inside Teams, the frontend can call
//   microsoftTeams.authentication.getAuthToken()
// and send the resulting JWT here to exchange it for a Graph API token.
app.post('/api/auth/teams-sso', async (req, res) => {
  try {
    const { token: teamsToken } = req.body;
    if (!teamsToken) {
      return res.status(400).json({ status: 'error', message: 'Missing token in request body' });
    }

    const { exchangeTeamsTokenForGraph } = await import('./services/auth/azureAuth.js');
    const result = await exchangeTeamsTokenForGraph(teamsToken);

    if (result.success) {
      return res.json({
        status: 'success',
        graphToken: result.graphToken,
        expiresOn: result.expiresOn
      });
    } else {
      return res.status(401).json({
        status: 'error',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Teams SSO error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// Initialize Graph API on startup
initializeGraphClient();

// ============================================
// END MICROSOFT GRAPH API CONFIGURATION
// ============================================

// ============================================
// SUPABASE API ENDPOINTS
// ============================================

// Test Supabase connection on startup
testSupabaseConnection();

// ==================== AUTH ENDPOINTS ====================

// Lookup user by email and return their role (for login routing)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    // Prototype auth: all passwords are "test123"
    if (password !== 'test123') {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    // Look up user in user_profiles by email
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name, email, role')
      .eq('email', email.trim())
      .single();

    if (error || !data) {
      return res.status(401).json({ status: 'error', message: 'Email not found. Access denied.' });
    }

    // Audit log – fire-and-forget (don't block login response)
    supabase.from('system_logs').insert([{
      action: 'USER_LOGIN',
      description: `${data.first_name} ${data.last_name} (${data.role}) logged in`,
      performed_by: data.user_id,
      metadata: { email: data.email, role: data.role }
    }]).then();

    res.json({
      status: 'success',
      user: {
        user_id: data.user_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        role: data.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== STUDENT ENDPOINTS ====================

// Get student by email
app.get('/api/students/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await studentService.getStudentByEmail(email);
    if (result.success) {
      res.json({ status: 'success', student: result.student });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await studentService.getStudentById(id);
    if (result.success) {
      res.json({ status: 'success', student: result.student });
    } else {
      res.status(404).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create new student
app.post('/api/students', async (req, res) => {
  try {
    const result = await studentService.createStudent(req.body);
    if (result.success) {
      res.status(201).json({ status: 'success', student: result.student });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await studentService.updateStudent(id, req.body);
    if (result.success) {
      res.json({ status: 'success', student: result.student });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Enroll student face (photo upload + vector extraction)
app.post('/api/students/:id/enroll-face', async (req, res) => {
  try {
    const { id } = req.params;
    const { image, consent } = req.body;

    // Validate input
    if (!image) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No image data provided' 
      });
    }

    if (!consent) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Consent is required for biometric enrollment' 
      });
    }

    // Validate file format (check base64 header)
    const imageFormatMatch = image.match(/^data:image\/(jpeg|jpg|png);base64,/);
    if (!imageFormatMatch) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Invalid image format. Only JPG and PNG are supported.' 
      });
    }

    // Validate file size (approximate, base64 is ~33% larger than binary)
    const base64Data = image.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (sizeInBytes > maxSize) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Image size exceeds 5MB limit. Please upload a smaller image.' 
      });
    }

    // Call Python service to extract face vector
    console.log(`[Enrollment] Extracting face vector for student ${id}...`);
    let vectorResponse;
    try {
      vectorResponse = await axios.post('http://localhost:5000/api/enroll-face', {
        image: image
      });
    } catch (error) {
      // Handle specific face validation errors from Python service
      if (error.response && error.response.data) {
        return res.status(error.response.status).json({
          status: 'error',
          message: error.response.data.message,
          detail: error.response.data.detail
        });
      }
      throw error;
    }

    const faceVector = vectorResponse.data.vector;
    console.log(`[Enrollment] Face vector extracted successfully (length: ${faceVector.length})`);

    // Convert base64 to buffer for storage
    const base64Image = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const fileExt = imageFormatMatch[1] === 'jpeg' ? 'jpg' : imageFormatMatch[1];
    const fileName = `${id}.${fileExt}`;

    // Delete any existing photos for this student (all extensions)
    console.log(`[Enrollment] Cleaning up old photos for student ${id}...`);
    const possibleFiles = [`${id}.jpg`, `${id}.jpeg`, `${id}.png`];
    const { data: existingFiles } = await supabase.storage
      .from('student-faces')
      .list('', { search: id });
    
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => f.name);
      const { error: deleteError } = await supabase.storage
        .from('student-faces')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.warn('[Enrollment] Warning: Could not delete old photos:', deleteError);
        // Continue anyway - upsert will handle same extension
      } else {
        console.log(`[Enrollment] Deleted ${filesToDelete.length} old photo(s)`);
      }
    }

    // Upload to Supabase Storage
    console.log(`[Enrollment] Uploading photo to Supabase Storage: ${fileName}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-faces')
      .upload(fileName, imageBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      console.error('[Enrollment] Storage upload error:', uploadError);
      return res.status(500).json({ 
        status: 'error', 
        message: `Failed to upload photo: ${uploadError.message}` 
      });
    }

    // Get signed URL for private bucket (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('student-faces')
      .createSignedUrl(fileName, 31536000); // 1 year in seconds
    
    if (urlError) {
      console.error('[Enrollment] Failed to generate signed URL:', urlError);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to generate photo URL' 
      });
    }
    
    const photoUrl = urlData.signedUrl;
    console.log(`[Enrollment] Photo uploaded successfully: ${photoUrl}`);

    // Check if student already has biometric record
    const { data: existingRecord, error: checkError } = await supabase
      .from('student_biometric_data')
      .select('biometric_id')
      .eq('student_id', id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[Enrollment] Database check error:', checkError);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database error while checking existing enrollment' 
      });
    }

    // Update or insert biometric record
    let dbResult;
    if (existingRecord) {
      // Update existing record
      console.log(`[Enrollment] Updating existing biometric record for student ${id}`);
      const { data, error } = await supabase
        .from('student_biometric_data')
        .update({
          face_profile: faceVector,
          consent_flag: true,
          captured_at: new Date().toISOString()
        })
        .eq('student_id', id)
        .select();
      
      dbResult = { data, error };
    } else {
      // Insert new record
      console.log(`[Enrollment] Creating new biometric record for student ${id}`);
      const { data, error } = await supabase
        .from('student_biometric_data')
        .insert({
          student_id: id,
          face_profile: faceVector,
          consent_flag: true,
          captured_at: new Date().toISOString()
        })
        .select();
      
      dbResult = { data, error };
    }

    if (dbResult.error) {
      console.error('[Enrollment] Database error:', dbResult.error);
      return res.status(500).json({ 
        status: 'error', 
        message: `Failed to save biometric data: ${dbResult.error.message}` 
      });
    }

    // Update user_profiles with photo URL
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ photo_url: photoUrl })
      .eq('user_id', id);

    if (profileError) {
      console.error('[Enrollment] Profile update error:', profileError);
      // Don't fail the request, just log the error
    }

    console.log(`[Enrollment] ✅ Student ${id} enrolled successfully`);

    // Fire-and-forget: tell the Python service to reload its face vector cache
    // so the new student is recognised on the live feed immediately.
    axios.post(`${FACIAL_RECOGNITION_SERVICE_URL}/api/refresh-vectors`, null, { timeout: 10000 })
      .then(r => console.log(`[Enrollment] Python vector cache refreshed (${r.data.cache_size} vectors)`))
      .catch(err => console.warn('[Enrollment] Could not refresh Python vector cache:', err.message));

    res.json({ 
      status: 'success', 
      message: 'Face enrolled successfully',
      data: {
        photo_url: photoUrl,
        enrolled_at: dbResult.data[0].captured_at,
        biometric_id: dbResult.data[0].biometric_id
      }
    });

  } catch (error) {
    console.error('[Enrollment] Unexpected error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Enrollment failed due to server error'
    });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const result = await studentService.getAllStudents();
    if (result.success) {
      res.json({ status: 'success', students: result.students });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== COURSE ENDPOINTS ====================

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const result = await courseService.getAllCourses();
    if (result.success) {
      res.json({ status: 'success', courses: result.courses });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get courses for a professor
app.get('/api/courses/professor/:professorId', async (req, res) => {
  try {
    const { professorId } = req.params;
    const result = await courseService.getProfessorCourses(professorId);
    if (result.success) {
      res.json({ status: 'success', courses: result.courses });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get course by ID
app.get('/api/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await courseService.getCourseById(courseId);
    if (result.success) {
      res.json({ status: 'success', course: result.course });
    } else {
      res.status(404).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create new course
app.post('/api/courses', async (req, res) => {
  try {
    const result = await courseService.createCourse(req.body);
    if (result.success) {
      res.status(201).json({ status: 'success', course: result.course });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get students enrolled in a course
app.get('/api/courses/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await courseService.getCourseStudents(courseId);
    if (result.success) {
      res.json({ status: 'success', students: result.students });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== SESSION ENDPOINTS ====================

// Start a new session
app.post('/api/sessions/start', async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ status: 'error', message: 'courseId is required' });
    }
    
    const result = await sessionService.startSession(courseId);
    if (result.success) {
      res.status(201).json({ status: 'success', session: result.session });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// End a session
app.post('/api/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await sessionService.endSession(sessionId);
    if (result.success) {
      res.json({ status: 'success', session: result.session });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get active session for a course
app.get('/api/sessions/active/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const result = await sessionService.getActiveSession(courseId);
    if (result.success) {
      res.json({ status: 'success', session: result.session });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get session by ID with full details
app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await sessionService.getSessionById(sessionId);
    if (result.success) {
      res.json({ status: 'success', session: result.session });
    } else {
      res.status(404).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get session history for a course
app.get('/api/sessions/history/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const result = await sessionService.getCourseSessionHistory(courseId, limit);
    if (result.success) {
      res.json({ status: 'success', sessions: result.sessions });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all completed sessions
app.get('/api/sessions/completed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const result = await sessionService.getAllCompletedSessions(limit);
    if (result.success) {
      res.json({ status: 'success', sessions: result.sessions });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== ATTENDANCE ENDPOINTS ====================

// Record attendance
app.post('/api/attendance/record', async (req, res) => {
  try {
    const { sessionId, studentId, type, metadata } = req.body;
    
    if (!sessionId || !studentId || !type) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'sessionId, studentId, and type are required' 
      });
    }
    
    // Check if already recorded
    const checkResult = await attendanceService.checkAttendanceExists(sessionId, studentId);
    if (checkResult.exists) {
      return res.status(409).json({
        status: 'error',
        message: 'Attendance already recorded for this student in this session',
        existingRecord: checkResult.record
      });
    }
    
    const result = await attendanceService.recordAttendance(sessionId, studentId, type, metadata);
    if (result.success) {
      res.status(201).json({ status: 'success', attendance: result.attendance });
    } else {
      res.status(400).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get attendance for a session
app.get('/api/attendance/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await attendanceService.getSessionAttendance(sessionId);
    if (result.success) {
      res.json({ status: 'success', attendance: result.attendance });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get attendance summary for a session
app.get('/api/attendance/session/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await attendanceService.getSessionAttendanceSummary(sessionId);
    if (result.success) {
      res.json({ status: 'success', summary: result.summary });
    } else {
      res.status(500).json({ status: 'error', message: result.error });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==================== EXPORT ENDPOINTS ====================

// Export session attendance as CSV
app.get('/api/export/session/:sessionId/csv', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await sessionService.getSessionById(sessionId);
    
    if (!result.success) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }
    
    const csv = generateAttendanceCSV(result.session);
    const filename = `attendance_${result.session.courses.course_code}_${new Date(result.session.start_time).toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Export bulk sessions as CSV
app.post('/api/export/bulk/csv', async (req, res) => {
  try {
    const { sessionIds } = req.body;
    
    if (!sessionIds || !Array.isArray(sessionIds)) {
      return res.status(400).json({ status: 'error', message: 'sessionIds array is required' });
    }
    
    // Fetch all sessions
    const sessions = await Promise.all(
      sessionIds.map(id => sessionService.getSessionById(id))
    );
    
    const validSessions = sessions
      .filter(r => r.success)
      .map(r => r.session);
    
    if (validSessions.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No valid sessions found' });
    }
    
    const csv = generateAttendanceCSV(validSessions, true);
    const filename = `attendance_bulk_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get session summary for reporting
app.get('/api/export/session/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await sessionService.getSessionById(sessionId);
    
    if (!result.success) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }
    
    const summary = generateAttendanceSummary(result.session);
    res.json({ status: 'success', summary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// END SUPABASE API ENDPOINTS
// ============================================

// SPA fallback: serve index.html for all non-API routes (React Router support)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api') && !req.path.startsWith('/static')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('React app not built. Run: npm run build');
    }
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Create HTTP server
const port = process.env.PORT || 3333;

if (sslOptions.key && sslOptions.cert) {
  https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}
