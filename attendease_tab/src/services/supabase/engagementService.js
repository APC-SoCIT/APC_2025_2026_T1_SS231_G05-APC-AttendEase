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
        engagement_score: eventData.engagement_score || null,
        duration_seconds: eventData.duration_seconds || null,
        metadata: eventData.metadata || null,
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
      .select('event_type, engagement_score, student_id, duration_seconds')
      .eq('session_id', sessionId);

    if (error) throw error;

    const events = data || [];
    const handRaises = events.filter(e => e.event_type === 'hand_raised').length;
    const sleepingEvents = events.filter(e => e.event_type === 'sleeping').length;
    const speakingEvents = events.filter(e => e.event_type === 'speaking').length;
    const disengagedEvents = events.filter(e => e.event_type === 'disengaged').length;
    const engagedEvents = events.filter(e => e.event_type === 'engaged').length;

    const scores = events.filter(e => e.engagement_score != null).map(e => Number(e.engagement_score));
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

    // Per-student breakdown
    const studentMap = {};
    events.forEach(e => {
      if (!studentMap[e.student_id]) {
        studentMap[e.student_id] = { hand_raised: 0, sleeping: 0, speaking: 0, disengaged: 0, engaged: 0, scores: [] };
      }
      studentMap[e.student_id][e.event_type] = (studentMap[e.student_id][e.event_type] || 0) + 1;
      if (e.engagement_score != null) studentMap[e.student_id].scores.push(Number(e.engagement_score));
    });

    const studentBreakdown = Object.entries(studentMap).map(([studentId, stats]) => ({
      student_id: studentId,
      hand_raised: stats.hand_raised,
      sleeping: stats.sleeping,
      speaking: stats.speaking,
      disengaged: stats.disengaged,
      engaged: stats.engaged,
      avg_score: stats.scores.length > 0
        ? (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(1)
        : null,
    }));

    return {
      success: true,
      data: {
        totalEvents: events.length,
        handRaises,
        sleepingEvents,
        speakingEvents,
        disengagedEvents,
        engagedEvents,
        avgEngagementScore: avgScore,
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
      .select('session_id, event_type, engagement_score')
      .in('session_id', sessionIds);

    if (evtErr) throw evtErr;

    // Per-session aggregation
    const sessionSummaries = sessions.map(session => {
      const sEvents = (events || []).filter(e => e.session_id === session.id);
      const scores = sEvents.filter(e => e.engagement_score != null).map(e => Number(e.engagement_score));
      return {
        session_id: session.id,
        session_date: session.session_date,
        start_time: session.start_time,
        totalEvents: sEvents.length,
        handRaises: sEvents.filter(e => e.event_type === 'hand_raised').length,
        sleepingEvents: sEvents.filter(e => e.event_type === 'sleeping').length,
        disengagedEvents: sEvents.filter(e => e.event_type === 'disengaged').length,
        engagedEvents: sEvents.filter(e => e.event_type === 'engaged').length,
        avgScore: scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null,
      };
    });

    // Totals
    const allEvents = events || [];
    const allScores = allEvents.filter(e => e.engagement_score != null).map(e => Number(e.engagement_score));
    const totals = {
      totalSessions: sessions.length,
      totalEvents: allEvents.length,
      handRaises: allEvents.filter(e => e.event_type === 'hand_raised').length,
      sleepingEvents: allEvents.filter(e => e.event_type === 'sleeping').length,
      disengagedEvents: allEvents.filter(e => e.event_type === 'disengaged').length,
      engagedEvents: allEvents.filter(e => e.event_type === 'engaged').length,
      avgScore: allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : null,
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
