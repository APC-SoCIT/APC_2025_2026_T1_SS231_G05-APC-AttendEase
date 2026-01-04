/**
 * Browser Console Testing Helpers
 * 
 * To use in browser console:
 * 1. Make sure this file is imported somewhere in your app
 * 2. Open browser console (F12)
 * 3. Type: window.scheduleTest.createSample()
 * 4. Or access individual functions like: window.scheduleTest.getAll()
 */

import * as scheduleService from './scheduleService';

// Create test helper object
const scheduleTest = {
    // Get all schedules
    getAll: () => {
        const schedules = scheduleService.getAllSchedules();
        console.log('📚 All Schedules:');
        console.table(schedules);
        return schedules;
    },

    // Get current class
    getCurrent: () => {
        const current = scheduleService.getCurrentClass();
        if (current) {
            console.log('🎓 Current Class:', current);
        } else {
            console.log('✋ No class currently in session');
        }
        return current;
    },

    // Get upcoming classes
    getUpcoming: () => {
        const upcoming = scheduleService.getUpcomingClasses();
        console.log('⏰ Upcoming Classes:', upcoming);
        return upcoming;
    },

    // Create a sample test class
    createSample: () => {
        try {
            const newClass = scheduleService.createSchedule({
                name: "Test Class - " + new Date().toLocaleTimeString(),
                room: "Test Room 999",
                days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                startTime: "10:00",
                endTime: "11:30",
                description: "This is a test class",
                color: "#ff5722"
            });
            console.log('✅ Created test class:', newClass);
            return newClass;
        } catch (error) {
            console.error('❌ Error creating class:', error.message);
        }
    },

    // Create Machine Learning class
    createML: () => {
        try {
            const newClass = scheduleService.createSchedule({
                name: "Machine Learning",
                room: "AI Lab 301",
                days: ["Mon", "Wed", "Fri"],
                startTime: "10:00",
                endTime: "11:30",
                description: "Intro to ML",
                color: "#9c27b0"
            });
            console.log('✅ Created ML class:', newClass);
            return newClass;
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    },

    // Update a class by ID
    update: (id, updates) => {
        try {
            const updated = scheduleService.updateSchedule(id, updates);
            console.log('✅ Updated class:', updated);
            return updated;
        } catch (error) {
            console.error('❌ Error updating:', error.message);
        }
    },

    // Delete a class by ID
    delete: (id) => {
        try {
            const success = scheduleService.deleteSchedule(id);
            if (success) {
                console.log('✅ Deleted class ID:', id);
            } else {
                console.log('❌ Class not found:', id);
            }
            return success;
        } catch (error) {
            console.error('❌ Error deleting:', error.message);
        }
    },

    // Check for conflicts
    checkConflict: (days, startTime, endTime) => {
        const conflict = scheduleService.checkTimeConflict(days, startTime, endTime);
        if (conflict) {
            console.log('⚠️ Conflict detected:', conflict);
        } else {
            console.log('✅ No conflicts found');
        }
        return conflict;
    },

    // Reset to defaults
    reset: () => {
        const defaults = scheduleService.resetToDefaults();
        console.log('🔄 Reset to default schedules');
        console.table(defaults);
        return defaults;
    },

    // Show help
    help: () => {
        console.log(`
📚 Schedule Testing Commands:
============================

window.scheduleTest.getAll()          - View all schedules
window.scheduleTest.getCurrent()      - Get current active class
window.scheduleTest.getUpcoming()     - Get upcoming classes today
window.scheduleTest.createSample()    - Create a test class
window.scheduleTest.createML()        - Create Machine Learning class
window.scheduleTest.update(id, {})    - Update class by ID
window.scheduleTest.delete(id)        - Delete class by ID
window.scheduleTest.checkConflict(days, start, end) - Check conflicts
window.scheduleTest.reset()           - Reset to default schedules
window.scheduleTest.help()            - Show this help

Example:
--------
window.scheduleTest.createSample()
window.scheduleTest.getAll()
window.scheduleTest.update(1, { room: "New Room" })
    `);
    }
};

// Expose to window for browser console access
if (typeof window !== 'undefined') {
    window.scheduleTest = scheduleTest;
    console.log('✅ Schedule test helpers loaded! Type: window.scheduleTest.help()');
}

export default scheduleTest;
