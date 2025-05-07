# Calendar Appointment Display Fix: Technical Document

## Introduction

The calendar functionality is a critical component of our healthcare application, allowing clinicians to view and manage patient appointments efficiently. Accurate appointment display across different days and timezones is essential for proper scheduling and patient care.

## Issue Summary

### Problem Description
Appointments were only displaying on the current day in the calendar view, despite being correctly stored in the database with proper start and end times. This issue affected the month view specifically, where appointments were visible only on the current day regardless of their actual scheduled date.

### Impact
This issue significantly impacted clinician workflow as it:
- Created confusion about appointment scheduling
- Required manual verification of appointment dates
- Reduced trust in the calendar interface
- Potentially led to missed appointments

### Verification
We confirmed that appointments were correctly stored in the database with proper UTC timestamps. The issue was isolated to the display logic in the calendar component, specifically in the `useMonthViewData.tsx` hook.

## Root Cause Analysis

The root cause was identified as inconsistent date comparison methods between Luxon DateTime objects and JavaScript Date objects.

### Technical Details

In the `useMonthViewData.tsx` hook, the calendar days were represented as Luxon DateTime objects, while appointment dates were being processed differently:

1. Calendar days were generated using Luxon's DateTime objects:
```typescript
const days = TimeZoneService.eachDayOfInterval(startDate, endDate);
```

2. When mapping appointments to days, the comparison was problematic:
```typescript
// Previous problematic code (simplified)
days.forEach(day => {
  const dayStr = TimeZoneService.formatDate(day, 'yyyy-MM-dd');
  
  appointments.forEach(appointment => {
    const localStartDateTime = TimeZoneService.fromUTC(appointment.start_at, userTimeZone);
    
    // The issue: Comparing a Luxon DateTime with a different object type
    // or using string comparison instead of proper DateTime comparison
    if (/* incorrect comparison logic */) {
      // Add appointment to this day
    }
  });
});
```

The inconsistent handling of date objects led to incorrect comparisons, causing appointments to only match with the current day.

## Implemented Solution

The solution implemented was to ensure consistent use of Luxon DateTime objects and proper comparison methods:

```typescript
// Convert JS Date to Luxon DateTime for proper comparison
const dayDateTime = TimeZoneService.fromJSDate(day, userTimeZone);
          
// Use Luxon's hasSame method for day-level comparison
if (localStartDateTime.hasSame(dayDateTime, 'day')) {
  // Add appointment to this day
}
```

### Key Changes

1. **Consistent Object Types**: Ensuring all date objects are Luxon DateTime objects before comparison
2. **Proper Comparison Method**: Using Luxon's `hasSame()` method specifically designed for comparing dates at various granularities (day, month, year, etc.)
3. **Explicit Timezone Handling**: Ensuring all DateTime objects use the same timezone for comparison

This solution ensures that appointments are correctly matched to their respective days in the calendar view, regardless of the current date.

## Recommendations for Preventing Similar Issues

### 1. Consistent Date/Time Library Usage

- **Standardize on Luxon**: Use Luxon DateTime objects consistently throughout the application
- **Avoid Mixing Libraries**: Don't mix JavaScript Date objects with Luxon DateTime objects
- **Create Adapters**: If integration with external libraries requires different date formats, create adapter functions to convert between formats

```typescript
// GOOD: Consistent use of Luxon
const startDate = DateTime.fromISO(isoString);
const endDate = startDate.plus({ hours: 1 });
const isSameDay = startDate.hasSame(endDate, 'day');

// AVOID: Mixing date libraries
const startDate = new Date(isoString);
const endDate = DateTime.fromJSDate(startDate).plus({ hours: 1 });
const isSameDay = startDate.toISOString().split('T')[0] === endDate.toFormat('yyyy-MM-dd');
```

### 2. Timezone Handling Best Practices

- **Store in UTC**: Always store dates in UTC format in the database
- **Convert for Display**: Convert to local timezone only when displaying to users
- **Explicit Timezone**: Always specify timezone when creating DateTime objects
- **User Preferences**: Respect user timezone preferences throughout the application

```typescript
// GOOD: Explicit timezone handling
const utcDateTime = DateTime.fromISO(timestamp, { zone: 'UTC' });
const localDateTime = utcDateTime.setZone(userTimeZone);
const displayTime = localDateTime.toFormat('h:mm a');

// AVOID: Implicit timezone conversion
const dateTime = DateTime.fromISO(timestamp);
const displayTime = dateTime.toFormat('h:mm a');
```

### 3. Date Comparison Guidelines

- **Use Built-in Methods**: Leverage Luxon's comparison methods (`equals`, `hasSame`, `diff`)
- **Avoid String Comparisons**: Don't convert dates to strings for comparison
- **Consistent Granularity**: Be explicit about the level of granularity in comparisons (day, hour, minute)
- **Handle Edge Cases**: Account for timezone boundaries, DST changes, and date line crossings

```typescript
// GOOD: Using proper comparison methods
if (startDate.hasSame(endDate, 'day')) {
  // Same day logic
}

// AVOID: String-based comparison
if (startDate.toFormat('yyyy-MM-dd') === endDate.toFormat('yyyy-MM-dd')) {
  // Same day logic
}
```

### 4. Refactoring Opportunities

- **Centralize Date Logic**: Extend the TimeZoneService to include common date operations
- **Create Helper Functions**: Implement specific helpers for calendar-related date operations
- **Add Unit Tests**: Create tests for date comparison edge cases, especially around timezone boundaries
- **Documentation**: Document date handling patterns and expectations

```typescript
// Example of a centralized helper function
class TimeZoneService {
  // Existing methods...
  
  /**
   * Determines if two appointments overlap
   * @param appt1 First appointment
   * @param appt2 Second appointment
   * @returns boolean indicating if the appointments overlap
   */
  static doAppointmentsOverlap(appt1: Appointment, appt2: Appointment, timezone: string): boolean {
    const start1 = TimeZoneService.fromUTC(appt1.start_at, timezone);
    const end1 = TimeZoneService.fromUTC(appt1.end_at, timezone);
    const start2 = TimeZoneService.fromUTC(appt2.start_at, timezone);
    const end2 = TimeZoneService.fromUTC(appt2.end_at, timezone);
    
    return (start1 < end2 && start2 < end1);
  }
}
```

## Conclusion

The calendar appointment display issue was successfully resolved by ensuring consistent date comparison methods between Luxon DateTime objects. By converting JavaScript Date objects to Luxon DateTime objects and using Luxon's `hasSame()` method for day-level comparison, we've ensured that appointments correctly display on their scheduled days.

Implementing the recommendations outlined in this document will help prevent similar issues in the future and improve the overall robustness of date and time handling throughout the application. Consistent use of date libraries, proper timezone handling, and centralized date comparison logic are key to maintaining a reliable calendar system.

Next steps should include a comprehensive review of date handling across the application to identify and address any similar inconsistencies, as well as implementing the suggested refactoring opportunities to improve code maintainability.