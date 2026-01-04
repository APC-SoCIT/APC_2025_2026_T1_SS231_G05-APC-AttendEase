# Schedule Service - Quick Reference

## Import
```javascript
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getCurrentClass,
  getUpcomingClasses,
  checkTimeConflict
} from './services/scheduleService';
```

## Basic Usage

### Create
```javascript
const newClass = createSchedule({
  name: "Machine Learning",
  room: "Lab 301",
  days: ["Mon", "Wed", "Fri"],
  startTime: "10:00",
  endTime: "11:30",
  description: "Intro to ML", // optional
  color: "#0078d4" // optional
});
```

### Read
```javascript
const all = getAllSchedules();
const one = getScheduleById(1);
const current = getCurrentClass();
const upcoming = getUpcomingClasses();
```

### Update
```javascript
updateSchedule(1, {
  room: "Lab 402",
  startTime: "09:30"
});
```

### Delete
```javascript
deleteSchedule(1);
```

### Check Conflicts
```javascript
const conflict = checkTimeConflict(
  ["Mon", "Wed"],
  "10:00",
  "11:30",
  2 // exclude ID 2 (optional)
);
```

## Schedule Object Structure
```javascript
{
  id: 1,
  name: "Web Development",
  room: "Room 301",
  days: ["Mon", "Wed", "Fri"],
  startTime: "09:00",
  endTime: "10:30",
  description: "Advanced web dev",
  color: "#0078d4",
  isActive: true,
  createdAt: "2026-01-02T12:00:00Z",
  updatedAt: "2026-01-02T12:00:00Z"
}
```

## Day Abbreviations
`"Sun"`, `"Mon"`, `"Tue"`, `"Wed"`, `"Thu"`, `"Fri"`, `"Sat"`
