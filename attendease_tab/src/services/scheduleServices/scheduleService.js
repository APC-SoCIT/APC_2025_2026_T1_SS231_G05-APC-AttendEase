/**
 * Class Schedule Service
 * Handles CRUD operations for managing class schedules
 * Data is stored in localStorage for persistence
 */

const STORAGE_KEY = 'professor_class_schedules';

/**
 * Get all scheduled classes (prefers Supabase if configured)
 * @returns {Promise<Array>} Array of class schedule objects
 */
import { supabase } from '../../config/supabase.config.js';

export const getAllSchedules = async () => {
    // If Supabase is configured, fetch from `course_schedules` and normalize
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('course_schedules')
                .select('*, courses(course_code, description), sections(name)')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching course_schedules from Supabase:', error);
                // fallback to localStorage
            } else if (data) {
                // Normalize remote rows into local schedule model
                const normalized = data.map(row => {
                    let scheduleObj = {};
                    try {
                        scheduleObj = typeof row.schedule === 'string' ? JSON.parse(row.schedule) : (row.schedule || {});
                    } catch (e) {
                        scheduleObj = { name: row.schedule || '' };
                    }

                    return {
                        id: row.id,
                        // Prefer explicit name from stored schedule JSON or derive from course
                        name: scheduleObj.name || (row.courses ? row.courses.course_code : '') || scheduleObj.courseName || '',
                        room: row.room_number || scheduleObj.room || '',
                        days: scheduleObj.days || scheduleObj.daysOfWeek || [],
                        startTime: scheduleObj.startTime || scheduleObj.start_time || '',
                        endTime: scheduleObj.endTime || scheduleObj.end_time || '',
                        description: scheduleObj.description || '',
                        color: scheduleObj.color || '#0078d4',
                        isActive: scheduleObj.isActive !== undefined ? scheduleObj.isActive : true,
                        course: row.courses ? row.courses.course_code : (scheduleObj.course || ''),
                        course_id: row.course_id || null,
                        section: row.sections ? row.sections.name : (scheduleObj.section || ''),
                        section_id: row.section_id || null,
                        createdAt: row.created_at || null,
                        updatedAt: row.updated_at || null
                    };
                });

                return normalized;
            }
        } catch (err) {
            console.error('Unexpected error fetching schedules from Supabase:', err);
        }
    }

    // Fallback: read from localStorage
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultSchedules();
    } catch (error) {
        console.error('Error reading schedules from localStorage:', error);
        return getDefaultSchedules();
    }
};

/**
 * Get a single schedule by ID
 * @param {string|number} id - Schedule ID
 * @returns {Object|null} Schedule object or null if not found
 */
export const getScheduleById = (id) => {
    const schedules = getAllSchedules();
    return schedules.find(schedule => schedule.id === id) || null;
};

/**
 * Create a new class schedule
 * @param {Object} scheduleData - Schedule data
 * @param {string} scheduleData.name - Class name
 * @param {string} scheduleData.room - Room number/location
 * @param {Array<string>} scheduleData.days - Array of days (e.g., ["Mon", "Wed", "Fri"])
 * @param {string} scheduleData.startTime - Start time in HH:MM format
 * @param {string} scheduleData.endTime - End time in HH:MM format
 * @param {string} [scheduleData.description] - Optional class description
 * @param {string} [scheduleData.color] - Optional color code for UI
 * @returns {Object} Created schedule object with generated ID
 */
export const createSchedule = async (scheduleData) => {
    // Validate required fields
    if (!scheduleData.name || !scheduleData.room || !scheduleData.days ||
        !scheduleData.startTime || !scheduleData.endTime) {
        throw new Error('Missing required fields');
    }

    // Validate days array
    if (!Array.isArray(scheduleData.days) || scheduleData.days.length === 0) {
        throw new Error('Days must be a non-empty array');
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleData.startTime) || !timeRegex.test(scheduleData.endTime)) {
        throw new Error('Invalid time format. Use HH:MM');
    }

    // If Supabase configured, insert into course_schedules
    if (supabase) {
        try {
            const payload = {
                course_id: scheduleData.course_id || null,
                section_id: scheduleData.section_id || null,
                room_number: scheduleData.room,
                schedule: JSON.stringify({
                    name: scheduleData.name,
                    days: scheduleData.days,
                    startTime: scheduleData.startTime,
                    endTime: scheduleData.endTime,
                    description: scheduleData.description || '',
                    color: scheduleData.color || '#0078d4',
                    isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
                    course: scheduleData.course || '',
                    section: scheduleData.section || ''
                })
            };

            const { data, error } = await supabase
                .from('course_schedules')
                .insert([payload])
                .select()
                .single();

            if (error) {
                console.error('Error inserting schedule to Supabase:', error);
                throw error;
            }

            // Normalize returned row
            const row = data;
            let scheduleObj = {};
            try { scheduleObj = JSON.parse(row.schedule); } catch (e) { scheduleObj = {}; }

            return {
                id: row.id,
                name: scheduleObj.name || '',
                room: row.room_number || scheduleObj.room || '',
                days: scheduleObj.days || [],
                startTime: scheduleObj.startTime || '',
                endTime: scheduleObj.endTime || '',
                description: scheduleObj.description || '',
                color: scheduleObj.color || '#0078d4',
                isActive: scheduleObj.isActive !== undefined ? scheduleObj.isActive : true,
                course_id: row.course_id || null,
                section_id: row.section_id || null,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } catch (err) {
            console.error('Unexpected error creating schedule in Supabase:', err);
            throw err;
        }
    }

    // Fallback: localStorage
    try {
        const schedules = await getAllSchedules();

        // Generate new numeric ID (keep legacy behavior)
        const newId = schedules.length > 0
            ? Math.max(...schedules.map(s => (typeof s.id === 'number' ? s.id : 0))) + 1
            : 1;

        const newSchedule = {
            id: newId,
            name: scheduleData.name.trim(),
            room: scheduleData.room.trim(),
            days: scheduleData.days,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            description: scheduleData.description?.trim() || '',
            course: scheduleData.course || '',
            section: scheduleData.section || '',
            color: scheduleData.color || '#0078d4',
            isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existing = Array.isArray(schedules) ? schedules : [];
        existing.push(newSchedule);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

        return newSchedule;
    } catch (error) {
        console.error('Error creating schedule locally:', error);
        throw error;
    }
};

/**
 * Update an existing class schedule
 * @param {string|number} id - Schedule ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated schedule object or null if not found
 */
export const updateSchedule = async (id, updates) => {
    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (updates.startTime && !timeRegex.test(updates.startTime)) {
        throw new Error('Invalid start time format. Use HH:MM');
    }
    if (updates.endTime && !timeRegex.test(updates.endTime)) {
        throw new Error('Invalid end time format. Use HH:MM');
    }

    if (updates.days) {
        if (!Array.isArray(updates.days) || updates.days.length === 0) {
            throw new Error('Days must be a non-empty array');
        }
    }

    if (supabase) {
        try {
            // Build payload for update
            const payload = {};
            if (updates.room !== undefined) payload.room_number = updates.room;
            if (updates.course_id !== undefined) payload.course_id = updates.course_id;
            if (updates.section_id !== undefined) payload.section_id = updates.section_id;
            // Merge schedule JSON if time/day/name fields provided
            const scheduleJson = {};
            if (updates.name !== undefined) scheduleJson.name = updates.name;
            if (updates.days !== undefined) scheduleJson.days = updates.days;
            if (updates.startTime !== undefined) scheduleJson.startTime = updates.startTime;
            if (updates.endTime !== undefined) scheduleJson.endTime = updates.endTime;
            if (updates.description !== undefined) scheduleJson.description = updates.description;
            if (updates.color !== undefined) scheduleJson.color = updates.color;
            if (updates.isActive !== undefined) scheduleJson.isActive = updates.isActive;

            if (Object.keys(scheduleJson).length > 0) {
                // Fetch existing row to merge schedule JSON
                const { data: existing, error: fetchErr } = await supabase.from('course_schedules').select('schedule').eq('id', id).single();
                if (fetchErr) throw fetchErr;
                let existingSchedule = {};
                try { existingSchedule = existing?.schedule ? JSON.parse(existing.schedule) : {}; } catch (e) { existingSchedule = {}; }
                const merged = { ...existingSchedule, ...scheduleJson };
                payload.schedule = JSON.stringify(merged);
            }

            const { data, error } = await supabase.from('course_schedules').update(payload).eq('id', id).select().single();
            if (error) {
                console.error('Error updating schedule in Supabase:', error);
                throw error;
            }

            const row = data;
            let scheduleObj = {};
            try { scheduleObj = JSON.parse(row.schedule); } catch (e) { scheduleObj = {}; }

            return {
                id: row.id,
                name: scheduleObj.name || '',
                room: row.room_number || scheduleObj.room || '',
                days: scheduleObj.days || [],
                startTime: scheduleObj.startTime || '',
                endTime: scheduleObj.endTime || '',
                description: scheduleObj.description || '',
                color: scheduleObj.color || '#0078d4',
                isActive: scheduleObj.isActive !== undefined ? scheduleObj.isActive : true,
                course_id: row.course_id || null,
                section_id: row.section_id || null,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
        } catch (err) {
            console.error('Unexpected error updating schedule in Supabase:', err);
            throw err;
        }
    }

    // Fallback: localStorage update
    try {
        const schedules = await getAllSchedules();
        const index = schedules.findIndex(schedule => schedule.id === id);
        if (index === -1) {
            throw new Error(`Schedule with ID ${id} not found`);
        }

        schedules[index] = {
            ...schedules[index],
            course: updates.course !== undefined ? updates.course : schedules[index].course,
            section: updates.section !== undefined ? updates.section : schedules[index].section,
            ...updates,
            id: schedules[index].id,
            createdAt: schedules[index].createdAt,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
        return schedules[index];
    } catch (error) {
        console.error('Error updating schedule locally:', error);
        throw error;
    }
};

/**
 * Delete a class schedule
 * @param {string|number} id - Schedule ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export const deleteSchedule = async (id) => {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('course_schedules').delete().eq('id', id).select().single();
            if (error) {
                console.error('Error deleting schedule from Supabase:', error);
                throw error;
            }
            return true;
        } catch (err) {
            console.error('Unexpected error deleting schedule in Supabase:', err);
            throw err;
        }
    }

    try {
        const schedules = await getAllSchedules();
        const filteredSchedules = schedules.filter(schedule => schedule.id !== id);

        if (filteredSchedules.length === schedules.length) {
            return false; // Schedule not found
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSchedules));
        return true;
    } catch (error) {
        console.error('Error deleting schedule locally:', error);
        throw error;
    }
};

/**
 * Get schedules for a specific day
 * @param {string} day - Day name (e.g., "Mon", "Tue", etc.)
 * @returns {Array} Array of schedules for the specified day
 */
export const getSchedulesByDay = async (day) => {
    const schedules = await getAllSchedules();
    return (schedules || []).filter(schedule =>
        schedule.isActive && (schedule.days || []).includes(day)
    ).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
};

/**
 * Get the current active class based on current time and day
 * @returns {Object|null} Current active class or null
 */
export const getCurrentClass = async () => {
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todaySchedules = await getSchedulesByDay(currentDay);

    return (todaySchedules || []).find(schedule =>
        (schedule.startTime || '') <= currentTime && (schedule.endTime || '') >= currentTime
    ) || null;
};

/**
 * Get upcoming classes for today
 * @returns {Array} Array of upcoming classes
 */
export const getUpcomingClasses = async () => {
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todaySchedules = await getSchedulesByDay(currentDay);

    return (todaySchedules || []).filter(schedule => (schedule.startTime || '') > currentTime);
};

/**
 * Check if there's a time conflict with existing schedules
 * @param {Array<string>} days - Days to check
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @param {string|number} [excludeId] - Optional ID to exclude from conflict check
 * @returns {Object|null} Conflicting schedule or null
 */
export const checkTimeConflict = async (days, startTime, endTime, excludeId = null) => {
    const schedules = (await getAllSchedules() || []).filter(s => s.id !== excludeId);

    for (const schedule of schedules) {
        // Check if there's any day overlap
        const hasCommonDay = days.some(day => (schedule.days || []).includes(day));

        if (hasCommonDay) {
            // Check if there's time overlap
            const hasTimeOverlap = (
                (startTime >= schedule.startTime && startTime < schedule.endTime) ||
                (endTime > schedule.startTime && endTime <= schedule.endTime) ||
                (startTime <= schedule.startTime && endTime >= schedule.endTime)
            );

            if (hasTimeOverlap) {
                return schedule;
            }
        }
    }

    return null;
};

/**
 * Get default schedules (used when no data exists)
 * @returns {Array} Array of default schedule objects
 */
const getDefaultSchedules = () => {
    return [
        {
            id: 1,
            name: "Web Development",
            room: "Room 301",
            days: ["Mon", "Wed", "Fri"],
            startTime: "09:00",
            endTime: "10:30",
            description: "Advanced web development concepts",
            color: "#0078d4",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 2,
            name: "Database Systems",
            room: "Lab 205",
            days: ["Tue", "Thu"],
            startTime: "13:00",
            endTime: "14:30",
            description: "Database design and implementation",
            color: "#107c10",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 3,
            name: "Software Engineering",
            room: "Room 402",
            days: ["Mon", "Wed"],
            startTime: "14:00",
            endTime: "15:30",
            description: "Software development methodologies",
            color: "#d83b01",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];
};

/**
 * Reset schedules to default
 * @returns {Array} Default schedules
 */
export const resetToDefaults = () => {
    const defaults = getDefaultSchedules();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
};

/**
 * Export schedules as JSON
 * @returns {string} JSON string of all schedules
 */
export const exportSchedules = async () => {
    const schedules = await getAllSchedules();
    return JSON.stringify(schedules, null, 2);
};

/**
 * Import schedules from JSON
 * @param {string} jsonData - JSON string of schedules
 * @returns {boolean} True if successful
 */
export const importSchedules = (jsonData) => {
    try {
        const schedules = JSON.parse(jsonData);
        if (!Array.isArray(schedules)) {
            throw new Error('Invalid data format');
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
        return true;
    } catch (error) {
        console.error('Error importing schedules:', error);
        return false;
    }
};
