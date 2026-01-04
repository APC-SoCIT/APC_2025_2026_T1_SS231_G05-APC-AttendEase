/**
 * Class Schedule Service
 * Handles CRUD operations for managing class schedules
 * Data is stored in localStorage for persistence
 */

const STORAGE_KEY = 'professor_class_schedules';

/**
 * Get all scheduled classes
 * @returns {Array} Array of class schedule objects
 */
export const getAllSchedules = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultSchedules();
    } catch (error) {
        console.error('Error reading schedules:', error);
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
export const createSchedule = (scheduleData) => {
    try {
        const schedules = getAllSchedules();

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

        // Generate new ID
        const newId = schedules.length > 0
            ? Math.max(...schedules.map(s => s.id)) + 1
            : 1;

        const newSchedule = {
            id: newId,
            name: scheduleData.name.trim(),
            room: scheduleData.room.trim(),
            days: scheduleData.days,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime,
            description: scheduleData.description?.trim() || '',
            color: scheduleData.color || '#0078d4',
            isActive: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        schedules.push(newSchedule);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));

        return newSchedule;
    } catch (error) {
        console.error('Error creating schedule:', error);
        throw error;
    }
};

/**
 * Update an existing class schedule
 * @param {string|number} id - Schedule ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated schedule object or null if not found
 */
export const updateSchedule = (id, updates) => {
    try {
        const schedules = getAllSchedules();
        const index = schedules.findIndex(schedule => schedule.id === id);

        if (index === -1) {
            throw new Error(`Schedule with ID ${id} not found`);
        }

        // Validate time format if provided
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (updates.startTime && !timeRegex.test(updates.startTime)) {
            throw new Error('Invalid start time format. Use HH:MM');
        }
        if (updates.endTime && !timeRegex.test(updates.endTime)) {
            throw new Error('Invalid end time format. Use HH:MM');
        }

        // Validate days if provided
        if (updates.days) {
            if (!Array.isArray(updates.days) || updates.days.length === 0) {
                throw new Error('Days must be a non-empty array');
            }
        }

        // Update the schedule
        schedules[index] = {
            ...schedules[index],
            ...updates,
            id: schedules[index].id, // Ensure ID doesn't change
            createdAt: schedules[index].createdAt, // Preserve creation time
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));

        return schedules[index];
    } catch (error) {
        console.error('Error updating schedule:', error);
        throw error;
    }
};

/**
 * Delete a class schedule
 * @param {string|number} id - Schedule ID to delete
 * @returns {boolean} True if deleted, false if not found
 */
export const deleteSchedule = (id) => {
    try {
        const schedules = getAllSchedules();
        const filteredSchedules = schedules.filter(schedule => schedule.id !== id);

        if (filteredSchedules.length === schedules.length) {
            return false; // Schedule not found
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredSchedules));
        return true;
    } catch (error) {
        console.error('Error deleting schedule:', error);
        throw error;
    }
};

/**
 * Get schedules for a specific day
 * @param {string} day - Day name (e.g., "Mon", "Tue", etc.)
 * @returns {Array} Array of schedules for the specified day
 */
export const getSchedulesByDay = (day) => {
    const schedules = getAllSchedules();
    return schedules.filter(schedule =>
        schedule.isActive && schedule.days.includes(day)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
};

/**
 * Get the current active class based on current time and day
 * @returns {Object|null} Current active class or null
 */
export const getCurrentClass = () => {
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todaySchedules = getSchedulesByDay(currentDay);

    return todaySchedules.find(schedule =>
        schedule.startTime <= currentTime && schedule.endTime >= currentTime
    ) || null;
};

/**
 * Get upcoming classes for today
 * @returns {Array} Array of upcoming classes
 */
export const getUpcomingClasses = () => {
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todaySchedules = getSchedulesByDay(currentDay);

    return todaySchedules.filter(schedule => schedule.startTime > currentTime);
};

/**
 * Check if there's a time conflict with existing schedules
 * @param {Array<string>} days - Days to check
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @param {string|number} [excludeId] - Optional ID to exclude from conflict check
 * @returns {Object|null} Conflicting schedule or null
 */
export const checkTimeConflict = (days, startTime, endTime, excludeId = null) => {
    const schedules = getAllSchedules().filter(s => s.id !== excludeId);

    for (const schedule of schedules) {
        // Check if there's any day overlap
        const hasCommonDay = days.some(day => schedule.days.includes(day));

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
export const exportSchedules = () => {
    const schedules = getAllSchedules();
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
