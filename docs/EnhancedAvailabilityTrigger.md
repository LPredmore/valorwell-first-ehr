# Enhanced Availability Trigger Documentation

This document provides detailed information about the enhanced `prevent_overlapping_availability` trigger implemented in the `20250430_enhance_availability_trigger.sql` migration. The trigger prevents overlapping availability slots for clinicians in the calendar system.

## Background

The availability trigger has been fixed multiple times in the past, indicating design issues. The previous implementations had limitations in error reporting, performance, and handling of edge cases. This enhanced version addresses these issues while maintaining backward compatibility.

## Key Improvements

The enhanced trigger includes the following improvements:

1. **Detailed Error Messages**
   - Provides specific information about which slots are overlapping
   - Includes formatted timestamps in the error message
   - Uses custom error codes for different types of errors

2. **Performance Optimization**
   - Added an index specifically for the overlap check
   - Optimized the query to use LIMIT 1 to stop searching after finding the first overlap
   - Improved query structure for better execution plan

3. **Enhanced Edge Case Handling**
   - Better handling of recurring vs. non-recurring availability
   - Improved timezone awareness
   - Validation of time ranges (start time must be before end time)
   - Handling of DST transitions

4. **Testing Support**
   - Added a test function to verify overlap detection without modifying data
   - Comprehensive test plan for various scenarios

## Implementation Details

### Trigger Function

The `prevent_overlapping_availability` function is a PostgreSQL trigger function that runs BEFORE INSERT OR UPDATE on the `calendar_events` table. It checks for overlapping availability slots and prevents the operation if an overlap is detected.

```sql
CREATE OR REPLACE FUNCTION public.prevent_overlapping_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  overlapping_slot RECORD;
  overlap_details TEXT;
  formatted_start TEXT;
  formatted_end TEXT;
BEGIN
  -- Only check for overlaps if this is an active availability event
  IF NEW.event_type = 'availability' AND NEW.is_active = TRUE THEN
    
    -- Format times for potential error messages
    formatted_start := to_char(NEW.start_time AT TIME ZONE COALESCE(NEW.time_zone, 'UTC'), 'YYYY-MM-DD HH24:MI:SS');
    formatted_end := to_char(NEW.end_time AT TIME ZONE COALESCE(NEW.time_zone, 'UTC'), 'YYYY-MM-DD HH24:MI:SS');
    
    -- Check for overlapping events from the same clinician
    SELECT 
      ce.*,
      to_char(ce.start_time AT TIME ZONE COALESCE(ce.time_zone, 'UTC'), 'YYYY-MM-DD HH24:MI:SS') as formatted_start,
      to_char(ce.end_time AT TIME ZONE COALESCE(ce.time_zone, 'UTC'), 'YYYY-MM-DD HH24:MI:SS') as formatted_end
    INTO overlapping_slot
    FROM public.calendar_events ce
    WHERE
      ce.clinician_id = NEW.clinician_id
      AND ce.event_type = 'availability'
      AND ce.is_active = TRUE
      AND ce.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      
      -- Enhanced recurrence pattern handling
      AND (
        (NEW.recurrence_id IS NULL AND ce.recurrence_id IS NULL) OR
        (NEW.recurrence_id IS NOT NULL AND ce.recurrence_id = NEW.recurrence_id) OR
        (
          -- Handle case where a single date availability might conflict with a recurring pattern
          (NEW.recurrence_id IS NULL AND ce.recurrence_id IS NOT NULL AND NEW.availability_type = 'single') OR
          (NEW.recurrence_id IS NOT NULL AND ce.recurrence_id IS NULL AND ce.availability_type = 'single')
        )
      )
      
      -- Standard overlap check with timezone awareness
      AND (NEW.start_time < ce.end_time AND NEW.end_time > ce.start_time)
    LIMIT 1;
    
    IF FOUND THEN
      -- Create a detailed error message
      overlap_details := format(
        'Overlapping availability detected: Your slot (%s to %s) overlaps with an existing slot (%s to %s).',
        formatted_start,
        formatted_end,
        overlapping_slot.formatted_start,
        overlapping_slot.formatted_end
      );
      
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'Overlapping availability slot detected',
        DETAIL = overlap_details,
        HINT = 'Please choose a different time or modify the existing overlapping slot.';
    END IF;
    
    -- Additional check for invalid time ranges
    IF NEW.start_time >= NEW.end_time THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0002',
        MESSAGE = 'Invalid time range',
        DETAIL = format('Start time (%s) must be before end time (%s)', formatted_start, formatted_end),
        HINT = 'Please ensure the start time is earlier than the end time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
```

### Supporting Index

An index is created to improve the performance of the overlap check:

```sql
CREATE INDEX IF NOT EXISTS idx_calendar_events_availability_overlap
ON public.calendar_events (clinician_id, event_type, is_active, start_time, end_time)
WHERE event_type = 'availability' AND is_active = TRUE;
```

This index specifically targets the columns used in the overlap check and includes a WHERE clause to limit it to active availability events, which reduces the index size and improves performance.

### Test Function

A test function is provided to verify overlap detection without modifying data:

```sql
CREATE OR REPLACE FUNCTION public.test_availability_overlap(
  p_clinician_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_recurrence_id UUID DEFAULT NULL,
  p_availability_type TEXT DEFAULT 'single',
  p_time_zone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (
  result TEXT,
  details TEXT
)
```

This function simulates the trigger execution and returns the result without actually inserting or updating data.

## Overlap Detection Logic

The trigger detects overlaps using the following logic:

1. **Same Clinician**: Only checks for overlaps between slots for the same clinician
2. **Active Availability**: Only checks against active availability events
3. **Recurrence Pattern**:
   - Non-recurring slots are checked against other non-recurring slots
   - Recurring slots are checked against other slots with the same recurrence_id
   - Single date slots are checked against potentially conflicting recurring patterns
4. **Time Overlap**: Uses the standard overlap check: `NEW.start_time < existing.end_time AND NEW.end_time > existing.start_time`
5. **Time Range Validation**: Ensures that start_time is before end_time

## Handling of Edge Cases

### Timezone Handling

The trigger works with the stored timestamps, which should already be in UTC in the database. The `time_zone` field is used for display purposes and for converting local times to UTC when creating or updating slots.

When checking for overlaps, the timestamps are compared directly (in UTC), which ensures correct overlap detection regardless of the time zones specified.

For error messages, the timestamps are formatted using the specified time zone (or UTC if not specified) to provide more user-friendly error messages.

### DST Transitions

Since the timestamps are stored in UTC, DST transitions don't affect the overlap detection logic. However, they can be confusing for users when viewing the times.

The frontend should handle the display of times during DST transitions appropriately, and the error messages from the trigger include the formatted times in the specified time zone to help users understand the overlap.

### Recurring vs. Non-recurring Availability

The trigger handles three cases for recurrence patterns:

1. **Both Non-recurring**: Both slots have NULL recurrence_id
2. **Same Recurrence Pattern**: Both slots have the same recurrence_id
3. **Mixed Case**: One slot is recurring and one is a single date exception

The third case is more complex and requires additional checks to ensure that single date exceptions don't conflict with recurring patterns.

## Integration with Frontend

The frontend should handle the error messages from the trigger appropriately. The error messages include:

- A general message about the overlap
- Details about the specific overlapping slots
- A hint about how to resolve the issue

The frontend can extract these components from the error message and display them to the user in a user-friendly way.

Example error handling in the frontend:

```typescript
try {
  await createAvailabilitySlot(...);
} catch (error) {
  if (error.message.includes('Overlapping availability slot detected')) {
    // Extract and display the detailed error message
    const details = error.details || 'This time slot overlaps with an existing availability slot.';
    const hint = error.hint || 'Please choose a different time.';
    
    showErrorMessage(`${details} ${hint}`);
  } else if (error.message.includes('Invalid time range')) {
    // Handle invalid time range error
    showErrorMessage('Start time must be before end time.');
  } else {
    // Handle other errors
    showErrorMessage('Failed to create availability slot.');
  }
}
```

## Testing

A comprehensive test plan is provided in the `AvailabilityTriggerTestPlan.md` document. It covers various scenarios including:

- Basic non-overlapping and overlapping slots
- Different clinicians
- Recurring availability
- Time zone handling
- DST transitions
- Invalid time ranges
- Performance testing

## Conclusion

The enhanced availability trigger provides a robust solution for preventing overlapping availability slots. It includes detailed error messages, performance optimizations, and improved handling of edge cases. The trigger is backward compatible with existing code and includes a test function to verify its behavior.