/**
 * Microsoft Graph API Client — Delegated Token Approach
 *
 * Instead of using application-level credentials (which require full Entra admin
 * access), this module provides helpers for the delegated-token approach:
 *
 *   1. Professor pastes their Graph Explorer access token in the UI
 *   2. Token is sent to our Express backend as a Bearer header
 *   3. Backend proxies requests to Graph API using that token
 *
 * The backend endpoints are defined in src/app.js:
 *   GET  /api/graph/delegated/verify-token   — verifies the token via GET /me
 *   GET  /api/graph/delegated/meetings        — lists professor's online meetings
 *   GET  /api/graph/delegated/online/:meetingId — gets attendance report
 *   POST /api/attendance/online/save           — persists attendance to Supabase
 *   POST /api/attendance/online/upload-csv     — persists CSV-parsed data
 *
 * This file exports thin wrapper functions that can be imported by React components
 * if you prefer using JS functions over inline fetch() calls.
 */

/**
 * Verify a Graph Explorer access token.
 * @param {string} token - Bearer access token
 * @returns {Promise<{status: string, user?: object, message?: string}>}
 */
export async function verifyGraphToken(token) {
  const res = await fetch('/api/graph/delegated/verify-token', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

/**
 * List the signed-in user's online meetings.
 * @param {string} token
 * @returns {Promise<{status: string, meetings?: Array, message?: string}>}
 */
export async function listOnlineMeetings(token) {
  const res = await fetch('/api/graph/delegated/meetings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

/**
 * Get the attendance report for a specific meeting.
 * @param {string} token
 * @param {string} meetingId
 * @returns {Promise<{status: string, students?: Array, message?: string}>}
 */
export async function getMeetingAttendance(token, meetingId) {
  const res = await fetch(`/api/graph/delegated/online/${encodeURIComponent(meetingId)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

/**
 * Save Graph-API-fetched online attendance to Supabase.
 * @param {Object} payload - { sessionId?, students, meetingSubject?, meetingStartTime?, meetingEndTime? }
 */
export async function saveOnlineAttendance(payload) {
  const res = await fetch('/api/attendance/online/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

/**
 * Save CSV-parsed engagement data to Supabase.
 * @param {Object} payload - { sessionId?, students, meetingSubject? }
 */
export async function saveCSVAttendance(payload) {
  const res = await fetch('/api/attendance/online/upload-csv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

/**
 * Check if Graph API is configured (application credentials — legacy check).
 */
export async function checkGraphStatus() {
  const res = await fetch('/api/attendance/graph-status');
  return res.json();
}

export default {
  verifyGraphToken,
  listOnlineMeetings,
  getMeetingAttendance,
  saveOnlineAttendance,
  saveCSVAttendance,
  checkGraphStatus,
};
