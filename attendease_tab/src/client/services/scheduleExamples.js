// ===================================================================
// SCHEDULE SERVICE CRUD EXAMPLES
// ===================================================================
// This file demonstrates how to use the schedule service functions
// Copy these examples to use in your code (like in browser console)
// ===================================================================

import {
    getAllSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    getCurrentClass,
    getUpcomingClasses,
    getSchedulesByDay,
    checkTimeConflict,
    resetToDefaults
} from './scheduleService';

// ===================================================================
// 1. CREATE - Add a new class schedule
// ===================================================================

// Example 1: Create a simple class
const example1 = () => {
    const newClass = createSchedule({
        name: "Data Structures",
        room: "Room 101",
        days: ["Tue", "Thu"],
        startTime: "10:00",
        endTime: "11:30"
    });

    console.log("Created:", newClass);
    // Created: { id: 4, name: "Data Structures", room: "Room 101", ... }
};

// Example 2: Create with all optional fields
const example2 = () => {
    const advancedClass = createSchedule({
        name: "Machine Learning",
        room: "AI Lab 301",
        days: ["Mon", "Wed", "Fri"],
        startTime: "14:00",
        endTime: "15:30",
        description: "Introduction to ML algorithms and neural networks",
        color: "#9c27b0" // Purple color
    });

    console.log("Created advanced class:", advancedClass);
};

// Example 3: Check for conflicts before creating
const example3 = () => {
    const days = ["Mon", "Wed"];
    const startTime = "09:00";
    const endTime = "10:30";

    // Check if there's a conflict
    const conflict = checkTimeConflict(days, startTime, endTime);

    if (conflict) {
        console.log(`Conflict detected with: ${conflict.name}`);
    } else {
        // No conflict, safe to create
        const newClass = createSchedule({
            name: "Algorithms",
            room: "Room 204",
            days: days,
            startTime: startTime,
            endTime: endTime
        });
        console.log("Created without conflicts:", newClass);
    }
};

// ===================================================================
// 2. READ - Get schedule information
// ===================================================================

// Example 4: Get all schedules
const example4 = () => {
    const allSchedules = getAllSchedules();
    console.log("All schedules:", allSchedules);
    console.log(`Total classes: ${allSchedules.length}`);
};

// Example 5: Get a specific schedule by ID
const example5 = () => {
    const schedule = getScheduleById(1);

    if (schedule) {
        console.log("Found schedule:", schedule);
    } else {
        console.log("Schedule not found");
    }
};

// Example 6: Get current active class
const example6 = () => {
    const current = getCurrentClass();

    if (current) {
        console.log(`Currently teaching: ${current.name}`);
        console.log(`Room: ${current.room}`);
        console.log(`Time: ${current.startTime} - ${current.endTime}`);
    } else {
        console.log("No class currently in session");
    }
};

// Example 7: Get upcoming classes today
const example7 = () => {
    const upcoming = getUpcomingClasses();

    if (upcoming.length > 0) {
        console.log("Upcoming classes:");
        upcoming.forEach(cls => {
            console.log(`- ${cls.name} at ${cls.startTime} in ${cls.room}`);
        });
    } else {
        console.log("No more classes today");
    }
};

// Example 8: Get classes for a specific day
const example8 = () => {
    const mondayClasses = getSchedulesByDay("Mon");

    console.log("Monday schedule:");
    mondayClasses.forEach(cls => {
        console.log(`${cls.startTime} - ${cls.endTime}: ${cls.name} (${cls.room})`);
    });
};

// ===================================================================
// 3. UPDATE - Modify existing schedules
// ===================================================================

// Example 9: Update room location
const example9 = () => {
    const updated = updateSchedule(1, {
        room: "New Room 505"
    });

    console.log("Updated schedule:", updated);
};

// Example 10: Update time slot
const example10 = () => {
    const updated = updateSchedule(2, {
        startTime: "13:30",
        endTime: "15:00"
    });

    console.log("Updated time:", updated);
};

// Example 11: Update multiple fields
const example11 = () => {
    const updated = updateSchedule(1, {
        name: "Advanced Web Development",
        room: "Computer Lab 2",
        description: "React, Node.js, and modern web technologies",
        color: "#2196f3"
    });

    console.log("Updated multiple fields:", updated);
};

// Example 12: Disable a class without deleting
const example12 = () => {
    const updated = updateSchedule(3, {
        isActive: false
    });

    console.log("Disabled class:", updated);
};

// ===================================================================
// 4. DELETE - Remove schedules
// ===================================================================

// Example 13: Delete a schedule
const example13 = () => {
    const success = deleteSchedule(4);

    if (success) {
        console.log("Schedule deleted successfully");
    } else {
        console.log("Schedule not found");
    }
};

// ===================================================================
// 5. UTILITY FUNCTIONS
// ===================================================================

// Example 14: Reset to default schedules
const example14 = () => {
    const defaults = resetToDefaults();
    console.log("Reset to defaults:", defaults);
};

// ===================================================================
// 6. INTEGRATION WITH REACT COMPONENT
// ===================================================================

// Example 15: Use in React component (ProfessorDashboard)
const ReactComponentExample = () => {
    /* 
    The ProfessorDashboard already has handlers set up:
    
    - handleCreateSchedule(scheduleData)
    - handleUpdateSchedule(id, updates)
    - handleDeleteSchedule(id)
    
    You can call them from the browser console like:
    */

    // In browser console:
    // window.createTestClass = () => {
    //   // Access React component instance and call handler
    // }
};

// ===================================================================
// 7. BROWSER CONSOLE TESTING
// ===================================================================

// To test in browser console, you can use this pattern:
/*
// Open browser console (F12) and run:

// 1. Import the service (if using ES modules)
import * as scheduleService from './services/scheduleService.js';

// 2. Create a test class
scheduleService.createSchedule({
  name: "Test Class",
  room: "Test Room",
  days: ["Mon"],
  startTime: "12:00",
  endTime: "13:00"
});

// 3. View all schedules
console.table(scheduleService.getAllSchedules());

// 4. Get current class
console.log(scheduleService.getCurrentClass());
*/

// ===================================================================
// EXPORT EXAMPLES FOR USE
// ===================================================================

export const runAllExamples = () => {
    console.log("=== Running all schedule service examples ===\n");

    console.log("1. Create examples:");
    example1();

    console.log("\n2. Read examples:");
    example4();
    example6();
    example7();

    console.log("\nExamples completed! Check the console output.");
};

// Export individual examples
export {
    example1,
    example2,
    example3,
    example4,
    example5,
    example6,
    example7,
    example8,
    example9,
    example10,
    example11,
    example12,
    example13,
    example14
};
