// Supabase Service: Engagement Logs
// Purpose: CRUD and analytics for student engagement events (hand raises, sleeping, etc.)

import { supabase } from '../../config/supabase.config.js';

// ============================================================================
// RECORD ENGAGEMENT
// ============================================================================

/**
 * Record a single engagement event
 * @param {Object} eventData - { session_id, student_id, event_type, engagement_score, duration_seconds, metadata }
 */
export async function recordEngagementEvent(eventData) {
  try {
    const { data, error } = await supabase
      .from('engagement_logs')
      .insert({
        session_id: eventData.session_id,
        student_id: eventData.student_id,
        event_type: eventData.event_type,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Error recording engagement event:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Record multiple engagement events in batch
 * @param {Array} events - Array of event objects
 */
export async function recordEngagementBatch(events) {
  try {
    const { data, error } = await supabase
      .from('engagement_logs')
      .insert(events)
      .select();

    if (error) throw error;

    return { success: true, data, error: null };
  } catch (err) {
    console.error('❌ Error recording engagement batch:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================================================
// QUERY ENGAGEMENT — PER SESSION
// ============================================================================

/**
 * Get all engagement events for a session
 */
export async function getSessionEngagement(sessionId) {
  try {
    const { data, error } = await supabase
      .from('engagement_logs')
      .select('*, user_profiles(user_id, first_name, last_name, student_number)')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('❌ Error fetching session engagement:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Get aggregated engagement summary for a session
 */
export async function getSessionEngagementSummary(sessionId) {
  try {
    const { data, error } = await supabase
      .from('engagement_logs')
      .select('event_type, student_id')
      .eq('session_id', sessionId);

    if (error) throw error;

    const events = data || [];

    // Map event types to simplified categories
    const mapCategory = (eventType) => {
      switch (eventType) {
        case 'hand_raised':
        case 'speaking':
        case 'engaged':
          return 'engaged';
        case 'sleeping':
        case 'disengaged':
          return 'disengaged';
        case 'present':
        default:
          return 'present';
      }
    };

    const engagedCount = events.filter(e => mapCategory(e.event_type) === 'engaged').length;
    const presentCount = events.filter(e => mapCategory(e.event_type) === 'present').length;
    const disengagedCount = events.filter(e => mapCategory(e.event_type) === 'disengaged').length;

    // Per-student breakdown
    const studentMap = {};
    events.forEach(e => {
      if (!studentMap[e.student_id]) {
        studentMap[e.student_id] = { engaged: 0, present: 0, disengaged: 0 };
      }
      const cat = mapCategory(e.event_type);
      studentMap[e.student_id][cat] = (studentMap[e.student_id][cat] || 0) + 1;
    });

    const studentBreakdown = Object.entries(studentMap).map(([studentId, stats]) => ({
      student_id: studentId,
      engaged: stats.engaged,
      present: stats.present,
      disengaged: stats.disengaged,
    }));

    return {
      success: true,
      data: {
        totalEvents: events.length,
        engagedCount,
        presentCount,
        disengagedCount,
        studentBreakdown,
      },
      error: null,
    };
  } catch (err) {
    console.error('❌ Error fetching session engagement summary:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================================================
// QUERY ENGAGEMENT — PER COURSE
// ============================================================================

/**
 * Get aggregated engagement summary for a course across all sessions
 */
export async function getCourseEngagementSummary(courseId) {
  try {
    // Get all session IDs for this course
    const { data: sessions, error: sessErr } = await supabase
      .from('sessions')
      .select('id, session_date, start_time')
      .eq('course_id', courseId)
      .order('session_date', { ascending: true });

    if (sessErr) throw sessErr;

    if (!sessions || sessions.length === 0) {
      return { success: true, data: { sessions: [], totals: null }, error: null };
    }

    const sessionIds = sessions.map(s => s.id);

    const { data: events, error: evtErr } = await supabase
      .from('engagement_logs')
      .select('session_id, event_type')
      .in('session_id', sessionIds);

    if (evtErr) throw evtErr;

    // Map event types to simplified categories
    const mapCategory = (eventType) => {
      switch (eventType) {
        case 'hand_raised':
        case 'speaking':
        case 'engaged':
          return 'engaged';
        case 'sleeping':
        case 'disengaged':
          return 'disengaged';
        case 'present':
        default:
          return 'present';
      }
    };

    // Per-session aggregation
    const sessionSummaries = sessions.map(session => {
      const sEvents = (events || []).filter(e => e.session_id === session.id);
      return {
        session_id: session.id,
        session_date: session.session_date,
        start_time: session.start_time,
        totalEvents: sEvents.length,
        engagedCount: sEvents.filter(e => mapCategory(e.event_type) === 'engaged').length,
        presentCount: sEvents.filter(e => mapCategory(e.event_type) === 'present').length,
        disengagedCount: sEvents.filter(e => mapCategory(e.event_type) === 'disengaged').length,
      };
    });

    // Totals
    const allEvents = events || [];
    const totals = {
      totalSessions: sessions.length,
      totalEvents: allEvents.length,
      engagedCount: allEvents.filter(e => mapCategory(e.event_type) === 'engaged').length,
      presentCount: allEvents.filter(e => mapCategory(e.event_type) === 'present').length,
      disengagedCount: allEvents.filter(e => mapCategory(e.event_type) === 'disengaged').length,
    };

    return { success: true, data: { sessions: sessionSummaries, totals }, error: null };
  } catch (err) {
    console.error('❌ Error fetching course engagement summary:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

// ============================================================================
// QUERY ENGAGEMENT — FOR EXPORT
// ============================================================================

/**
 * Get raw engagement data for export (flat records with student + session info)
 */
export async function getEngagementForExport(filters = {}) {
  try {
    let query = supabase
      .from('engagement_logs')
      .select(`
        *,
        user_profiles(first_name, last_name, student_number),
        sessions(session_date, course_id, courses(course_code, description))
      `)
      .order('timestamp', { ascending: false });

    if (filters.courseId) {
      // Need to filter through sessions
      const { data: sessionIds } = await supabase
        .from('sessions')
        .select('id')
        .eq('course_id', filters.courseId);
      if (sessionIds && sessionIds.length > 0) {
        query = query.in('session_id', sessionIds.map(s => s.id));
      }
    }

    if (filters.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data || [], error: null };
  } catch (err) {
    console.error('❌ Error fetching engagement for export:', err.message);
    return { success: false, data: null, error: err.message };
  }
}

export default {
  recordEngagementEvent,
  recordEngagementBatch,
  getSessionEngagement,
  getSessionEngagementSummary,
  getCourseEngagementSummary,
  getEngagementForExport,
};
