/**
 * Teams Meeting Attendance CSV Parser
 *
 * Parses the CSV that professors can download from the Teams meeting UI.
 * The CSV typically contains these columns (order may vary):
 *   Full Name, Join Time, Leave Time, Duration, Email, Role,
 *   In-Meeting Duration, Camera On Duration, Raised Hand Count, Reaction Count
 *
 * Some columns may be absent in older Teams versions — we handle that gracefully.
 */

/**
 * Parse a Teams duration string like "1h 2m 18s" or "45m 30s" or "18s" into seconds.
 */
export function parseDuration(str) {
  if (!str || typeof str !== 'string') return 0;
  const cleaned = str.trim();
  if (!cleaned) return 0;

  let totalSeconds = 0;

  const hourMatch = cleaned.match(/(\d+)\s*h/i);
  const minMatch = cleaned.match(/(\d+)\s*m(?!s)/i); // m but not ms
  const secMatch = cleaned.match(/(\d+)\s*s/i);

  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  if (minMatch) totalSeconds += parseInt(minMatch[1], 10) * 60;
  if (secMatch) totalSeconds += parseInt(secMatch[1], 10);

  return totalSeconds;
}

/**
 * Format seconds into a human-readable string like "1h 2m 18s".
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Normalise a header string so we can match columns regardless of casing, spacing, hyphens etc.
 */
function normalizeHeader(header) {
  return header.toLowerCase().replace(/[\s_\-]+/g, '').replace(/[^a-z0-9]/g, '');
}

// Map of normalised header -> our internal key
const HEADER_MAP = {
  fullname: 'fullName',
  name: 'fullName',
  jointime: 'joinTime',
  leavetime: 'leaveTime',
  duration: 'duration',
  email: 'email',
  emailaddress: 'email',
  role: 'role',
  inmeetingduration: 'inMeetingDuration',
  cameraonduration: 'cameraDuration',
  raisedhandcount: 'handRaiseCount',
  handraisecount: 'handRaiseCount',
  reactioncount: 'reactionCount',
  participantid: 'participantId',
};

/**
 * Parse CSV text into an array of row objects.
 * Handles quoted fields and embedded commas.
 */
function parseCSVRows(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  // Sometimes the Teams CSV starts with a BOM – strip it
  const headerLine = lines[0].replace(/^\uFEFF/, '');

  // Simple CSV field parser that handles quoted fields
  function splitRow(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = splitRow(headerLine);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = splitRow(lines[i]);
    if (fields.length < 2) continue; // skip malformed rows

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h.trim()] = fields[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

/**
 * Parse a Teams attendance CSV string and return enriched student records.
 *
 * @param {string} csvText - Raw CSV file content
 * @returns {{ students: Array, errors: string[], headerMapping: object }}
 */
export function parseTeamsCSV(csvText) {
  const { headers, rows } = parseCSVRows(csvText);
  const errors = [];

  if (headers.length === 0) {
    return { students: [], errors: ['CSV appears to be empty or malformed'], headerMapping: {} };
  }

  // Build column mapping
  const headerMapping = {};
  headers.forEach(h => {
    const key = normalizeHeader(h);
    if (HEADER_MAP[key]) {
      headerMapping[HEADER_MAP[key]] = h;
    }
  });

  const students = rows
    .filter(row => {
      // Skip organizer/presenter rows if desired (we keep them but mark the role)
      return true;
    })
    .map((row, idx) => {
      const get = (internalKey) => {
        const csvHeader = headerMapping[internalKey];
        return csvHeader ? (row[csvHeader] || '').trim() : '';
      };

      const fullName = get('fullName') || `Participant ${idx + 1}`;
      const email = get('email');
      const role = get('role') || 'Attendee';
      const joinTimeRaw = get('joinTime');
      const leaveTimeRaw = get('leaveTime');
      const durationRaw = get('duration');
      const inMeetingDurationRaw = get('inMeetingDuration');
      const cameraDurationRaw = get('cameraDuration');
      const handRaiseCountRaw = get('handRaiseCount');
      const reactionCountRaw = get('reactionCount');

      // Parse durations
      const durationSeconds = parseDuration(durationRaw);
      const inMeetingDurationSeconds = parseDuration(inMeetingDurationRaw) || durationSeconds;
      const cameraDurationSeconds = parseDuration(cameraDurationRaw);
      const handRaiseCount = parseInt(handRaiseCountRaw, 10) || 0;
      const reactionCount = parseInt(reactionCountRaw, 10) || 0;

      // Parse date-time strings (Teams uses formats like "2/18/2026 9:00:12 AM")
      let joinTime = null;
      let leaveTime = null;
      try {
        if (joinTimeRaw) joinTime = new Date(joinTimeRaw).toISOString();
      } catch { /* ignore parse error */ }
      try {
        if (leaveTimeRaw) leaveTime = new Date(leaveTimeRaw).toISOString();
      } catch { /* ignore parse error */ }

      // Compute enriched engagement score (0-100)
      // Weighted: 50% attendance duration, 20% camera, 15% hand raises, 15% reactions
      // Normalised so that a "perfect" meeting has score 100
      let engagementScore = 0;
      if (durationSeconds > 0) {
        const durationScore = Math.min(100, (inMeetingDurationSeconds / durationSeconds) * 100);
        const cameraScore = durationSeconds > 0
          ? Math.min(100, (cameraDurationSeconds / durationSeconds) * 100)
          : 0;
        // Hand raises: 3+ considered very engaged, cap at 5
        const handScore = Math.min(100, (handRaiseCount / 5) * 100);
        // Reactions: 5+ considered very engaged, cap at 10
        const reactionScore = Math.min(100, (reactionCount / 10) * 100);

        engagementScore = Math.round(
          durationScore * 0.50 +
          cameraScore * 0.20 +
          handScore * 0.15 +
          reactionScore * 0.15
        );
      }

      return {
        fullName,
        email,
        role,
        joinTime,
        leaveTime,
        durationSeconds,
        inMeetingDurationSeconds,
        cameraDurationSeconds,
        handRaiseCount,
        reactionCount,
        engagementScore,
        // Keep raw values for display
        _raw: {
          duration: durationRaw,
          inMeetingDuration: inMeetingDurationRaw,
          cameraDuration: cameraDurationRaw,
        }
      };
    });

  return { students, errors, headerMapping };
}

export default {
  parseTeamsCSV,
  parseDuration,
  formatDuration
};



