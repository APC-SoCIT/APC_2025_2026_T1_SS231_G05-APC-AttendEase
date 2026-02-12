/**
 * logService.js – CRUD helpers for the system_logs table (audit / activity logs).
 *
 * Uses the service-role Supabase client so RLS is bypassed on the server side.
 * On the client side the same service client is already imported elsewhere, so we
 * follow that existing pattern.
 */
import supabase from '../../config/supabase.config.js';

/**
 * Insert a single audit log entry.
 *
 * @param {{ action: string, description: string, performed_by?: string, metadata?: object }} log
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
export async function insertLog({ action, description, performed_by = null, metadata = {} }) {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .insert([{ action, description, performed_by, metadata }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('insertLog error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch logs with optional filters and pagination.
 *
 * @param {{ limit?: number, offset?: number, action?: string, search?: string, dateFrom?: string, dateTo?: string }} opts
 * @returns {{ success: boolean, data?: object[], count?: number, error?: string }}
 */
export async function fetchLogs({ limit = 50, offset = 0, action = '', search = '', dateFrom = '', dateTo = '' } = {}) {
  try {
    let query = supabase
      .from('system_logs')
      .select('*, performer:user_profiles!performed_by(first_name, last_name, email, role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (search) {
      query = query.ilike('description', `%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      // add a day so that "2024-01-15" includes the whole day
      query = query.lte('created_at', dateTo + 'T23:59:59.999Z');
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { success: true, data, count };
  } catch (err) {
    console.error('fetchLogs error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch quick stats for the logs dashboard.
 * Returns: total log count, logins today, user changes today.
 */
export async function fetchLogStats() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Total logs
    const { count: totalLogs, error: e1 } = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true });
    if (e1) throw e1;

    // Logins today
    const { count: loginsToday, error: e2 } = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'USER_LOGIN')
      .gte('created_at', todayISO);
    if (e2) throw e2;

    // User changes today (CREATED / UPDATED / DELETED)
    const { count: userChangesToday, error: e3 } = await supabase
      .from('system_logs')
      .select('id', { count: 'exact', head: true })
      .in('action', ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED'])
      .gte('created_at', todayISO);
    if (e3) throw e3;

    return { success: true, data: { totalLogs, loginsToday, userChangesToday } };
  } catch (err) {
    console.error('fetchLogStats error:', err);
    return { success: false, error: err.message };
  }
}
