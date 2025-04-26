# Timezone Handling Guide

This guide provides best practices and patterns for handling timezones in our application using the standardized TimeZoneService and TimeZoneContext system.

## Core Principles

1. **All timezone operations MUST use Luxon through the TimeZoneService class**
2. **All dates/times MUST be stored in UTC in the database**
3. **All timezone conversions MUST happen at the display layer only**
4. **All timezone strings MUST be in IANA format** (e.g., 'America/New_York')

## Using the TimeZoneContext

The TimeZoneContext provides the user's current timezone and related functionality:

```typescript
import { useTimeZone } from '@/context/TimeZoneContext';

const MyComponent = () => {
  const { 
    userTimeZone,         // Current user timezone (IANA format)
    isLoading,            // Loading state
    error,                // Any error that occurred
    isAuthenticated,      // Whether user is authenticated
    updateUserTimeZone    // Function to update user timezone
  } = useTimeZone();
  
  // Example usage
  if (isLoading) {
    return <div>Loading timezone...</div>;
  }
  
  return (
    <div>
      Your timezone is: {TimeZoneService.formatTimeZoneDisplay(userTimeZone)}
    </div>
  );
};
```

## Common Timezone Operations

### Getting User Timezone

```typescript
// From context (preferred method)
const { userTimeZone } = useTimeZone();

// Or directly from TimeZoneService (fallback)
const timezone = TimeZoneService.getUserTimeZone();
```

### Validating Timezone Strings

Always validate timezone input with `ensureIANATimeZone()`:

```typescript
const validTimeZone = TimeZoneService.ensureIANATimeZone(inputTimeZone);
```

This ensures the timezone is in IANA format and falls back to sensible defaults if invalid.

### Creating DateTime Objects

```typescript
// From date and time strings
const dt = TimeZoneService.createDateTime('2023-05-01', '14:30', 'America/New_York');

// From ISO string with timezone
const dt = TimeZoneService.parseWithZone('2023-05-01T14:30:00', 'America/New_York');
```

### Converting Between Timezones

```typescript
// Convert a datetime between timezones
const converted = TimeZoneService.convertDateTime(
  '2023-05-01T14:30:00',
  'America/New_York',
  'America/Los_Angeles'
);

// From UTC to user timezone
const localTime = TimeZoneService.fromUTC(utcString, userTimeZone);

// To UTC from local time
const utcTime = TimeZoneService.toUTC(localDateTime);
```

### Formatting for Display

```typescript
// Format a date/time with timezone
const formatted = TimeZoneService.formatDateTime(
  '2023-05-01T14:30:00', 
  'DATETIME_FULL',
  userTimeZone
);

// Format just the time portion
const timeStr = TimeZoneService.formatTime(
  '14:30:00', 
  'TIME_12H',
  userTimeZone
);

// Format a timezone for display
const tzDisplay = TimeZoneService.formatTimeZoneDisplay(userTimeZone);
// Example output: "America/New_York (EDT -04:00)"
```

### Calendar Event Conversion

```typescript
// Convert a calendar event to user timezone
const localEvent = TimeZoneService.convertEventToUserTimeZone(event, userTimeZone);
```

## Standard Formats

The `TimeZoneService` provides standard format strings:

```typescript
// Standard formats
TimeZoneService.formatDateTime(date, 'DATE_FULL');     // September 21, 2024
TimeZoneService.formatDateTime(date, 'DATE_SHORT');    // 9/21/2024
TimeZoneService.formatTime(time, 'TIME_12H');          // 3:45 PM
TimeZoneService.formatTime(time, 'TIME_24H');          // 15:45
TimeZoneService.formatDateTime(date, 'DATETIME_FULL'); // September 21, 2024, 3:45 PM
TimeZoneService.formatDateTime(date, 'DATETIME_SHORT'); // 9/21/2024, 3:45 PM
```

## Working with the Database

Always store times in UTC in the database:

```typescript
// Converting local time to UTC for storage
const utcDateTime = TimeZoneService.toUTC(localDateTime).toISO();

// Insert into database
await supabase
  .from('appointments')
  .insert({
    start_time: utcDateTime,
    // other fields...
  });

// When retrieving from database, convert to local time
const appointments = await supabase.from('appointments').select('*');
const localAppointments = appointments.data?.map(appointment => ({
  ...appointment,
  start_time_local: TimeZoneService.fromUTC(appointment.start_time, userTimeZone)
}));
```

## Timezone Selection in UI

Use the standardized timezone options for dropdowns:

```typescript
import { TimeZoneService } from '@/utils/timeZoneService';

// In your component
const timezoneOptions = TimeZoneService.TIMEZONE_OPTIONS;

// Then in your JSX
<select>
  {timezoneOptions.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

## Testing Timezone Code

When writing tests for timezone-sensitive code:

1. Mock the `useTimeZone` hook to return consistent values
2. Test edge cases like DST transitions
3. Test with multiple timezones (e.g., UTC, America/New_York, Asia/Tokyo)

## Troubleshooting

If you encounter timezone-related issues:

1. Verify all timezone strings are in IANA format using `TimeZoneService.ensureIANATimeZone()`
2. Check if time values are stored as UTC in the database
3. Ensure proper conversion at display time using `TimeZoneService.fromUTC()`
4. Look for mixing of timezone handling methods
