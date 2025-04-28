# Availability Trigger Test Plan

This document outlines the test plan for the enhanced `prevent_overlapping_availability` trigger implemented in the `20250430_enhance_availability_trigger.sql` migration. The test plan covers various scenarios to ensure the trigger correctly prevents overlapping availability slots while handling edge cases.

## Test Function

The migration includes a test function `test_availability_overlap` that can be used to test the trigger without actually inserting data. This function takes the following parameters:

- `p_clinician_id`: The clinician ID to test
- `p_start_time`: The start time of the availability slot
- `p_end_time`: The end time of the availability slot
- `p_recurrence_id`: (Optional) The recurrence ID for recurring slots
- `p_availability_type`: (Optional) The type of availability ('single' or 'recurring')
- `p_time_zone`: (Optional) The time zone for the availability slot

The function returns:
- `result`: 'SUCCESS' if no overlap is detected, 'CONFLICT' if an overlap is detected
- `details`: Details about the result, including error messages if applicable

## Test Scenarios

### 1. Basic Non-Overlapping Slots

Test that non-overlapping slots are allowed.

```sql
-- Create a test clinician
INSERT INTO profiles (id, email, role) 
VALUES ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'clinician');

-- Create an initial availability slot
INSERT INTO calendar_events (
  title, event_type, start_time, end_time, clinician_id, 
  availability_type, is_active, time_zone
)
VALUES (
  'Available', 'availability', 
  '2025-05-01 09:00:00+00', '2025-05-01 10:00:00+00',
  '11111111-1111-1111-1111-111111111111', 
  'single', true, 'UTC'
);

-- Test a non-overlapping slot (later the same day)
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-01 11:00:00+00', 
  '2025-05-01 12:00:00+00'
);
-- Expected result: SUCCESS
```

### 2. Basic Overlapping Slots

Test that overlapping slots are rejected.

```sql
-- Test an overlapping slot (overlaps with the 9-10 AM slot)
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-01 09:30:00+00', 
  '2025-05-01 10:30:00+00'
);
-- Expected result: CONFLICT
```

### 3. Exact Same Time Slot

Test that exact duplicate time slots are rejected.

```sql
-- Test exact same time slot
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-01 09:00:00+00', 
  '2025-05-01 10:00:00+00'
);
-- Expected result: CONFLICT
```

### 4. Different Clinicians

Test that slots for different clinicians don't conflict.

```sql
-- Create another test clinician
INSERT INTO profiles (id, email, role) 
VALUES ('22222222-2222-2222-2222-222222222222', 'test2@example.com', 'clinician');

-- Test same time slot but different clinician
SELECT * FROM test_availability_overlap(
  '22222222-2222-2222-2222-222222222222',
  '2025-05-01 09:00:00+00', 
  '2025-05-01 10:00:00+00'
);
-- Expected result: SUCCESS
```

### 5. Recurring Availability

Test that recurring availability slots are handled correctly.

```sql
-- Create a recurring availability slot
INSERT INTO calendar_events (
  title, event_type, start_time, end_time, clinician_id, 
  availability_type, is_active, time_zone
)
VALUES (
  'Available Weekly', 'availability', 
  '2025-05-05 13:00:00+00', '2025-05-05 14:00:00+00',
  '11111111-1111-1111-1111-111111111111', 
  'recurring', true, 'UTC'
);

-- Get the ID of the inserted record
DO $$
DECLARE
  v_event_id UUID;
BEGIN
  SELECT id INTO v_event_id FROM calendar_events 
  WHERE clinician_id = '11111111-1111-1111-1111-111111111111'
  AND start_time = '2025-05-05 13:00:00+00';
  
  -- Create recurrence rule
  INSERT INTO recurrence_rules (event_id, rrule)
  VALUES (v_event_id, 'FREQ=WEEKLY;BYDAY=MO');
  
  -- Update the recurrence_id
  UPDATE calendar_events SET recurrence_id = v_event_id
  WHERE id = v_event_id;
END $$;

-- Test overlapping with the recurring slot (same day and time)
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-12 13:00:00+00', 
  '2025-05-12 14:00:00+00',
  (SELECT id FROM calendar_events WHERE start_time = '2025-05-05 13:00:00+00'),
  'recurring'
);
-- Expected result: CONFLICT
```

### 6. Time Zone Handling

Test that time zone differences are handled correctly.

```sql
-- Test a slot that appears non-overlapping in different time zones but actually overlaps
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-01 09:00:00+00', -- This is UTC
  '2025-05-01 10:00:00+00',
  NULL,
  'single',
  'America/New_York' -- Eastern Time
);
-- Expected result: CONFLICT (because 9 AM UTC overlaps with the existing 9-10 AM UTC slot)
```

### 7. DST Transition Edge Case

Test handling of Daylight Saving Time transitions.

```sql
-- Create a slot during DST
INSERT INTO calendar_events (
  title, event_type, start_time, end_time, clinician_id, 
  availability_type, is_active, time_zone
)
VALUES (
  'Available DST', 'availability', 
  '2025-03-09 14:00:00+00', '2025-03-09 15:00:00+00', -- Day of DST transition in US
  '11111111-1111-1111-1111-111111111111', 
  'single', true, 'America/New_York'
);

-- Test a slot that would overlap after DST change
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-03-09 13:00:00+00', -- This is 1 hour before in UTC
  '2025-03-09 14:30:00+00',
  NULL,
  'single',
  'America/New_York'
);
-- Expected result: CONFLICT
```

### 8. Invalid Time Range

Test that invalid time ranges (end before start) are rejected.

```sql
-- Test invalid time range (end time before start time)
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-01 15:00:00+00', 
  '2025-05-01 14:00:00+00'
);
-- Expected result: CONFLICT with specific error about invalid time range
```

### 9. Single vs Recurring Overlap

Test that a single availability slot doesn't overlap with a recurring slot of a different pattern.

```sql
-- Test a single slot on a different day than the recurring pattern
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-05-06 13:00:00+00', -- Tuesday, not Monday
  '2025-05-06 14:00:00+00',
  NULL,
  'single'
);
-- Expected result: SUCCESS (because it's on Tuesday, not Monday)
```

### 10. Performance Testing

Test the performance of the trigger with a large number of existing availability slots.

```sql
-- Create many availability slots
DO $$
BEGIN
  FOR i IN 1..100 LOOP
    INSERT INTO calendar_events (
      title, event_type, start_time, end_time, clinician_id, 
      availability_type, is_active, time_zone
    )
    VALUES (
      'Available ' || i, 'availability', 
      ('2025-06-01'::date + (i || ' hours')::interval)::timestamptz, 
      ('2025-06-01'::date + (i + 1 || ' hours')::interval)::timestamptz,
      '11111111-1111-1111-1111-111111111111', 
      'single', true, 'UTC'
    );
  END LOOP;
END $$;

-- Time the execution of a test that should not overlap
EXPLAIN ANALYZE
SELECT * FROM test_availability_overlap(
  '11111111-1111-1111-1111-111111111111',
  '2025-06-10 13:00:00+00', 
  '2025-06-10 14:00:00+00'
);
-- Expected result: SUCCESS, with reasonable execution time
```

## Cleanup

After testing, you can clean up the test data:

```sql
-- Clean up test data
DELETE FROM recurrence_rules WHERE event_id IN (
  SELECT id FROM calendar_events 
  WHERE clinician_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
);

DELETE FROM calendar_events 
WHERE clinician_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

DELETE FROM profiles 
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
```

## Integration Testing with Frontend

To test the integration with the frontend:

1. Apply the migration:
   ```bash
   npx supabase migration up
   ```

2. Restart the Supabase services:
   ```bash
   npx supabase stop && npx supabase start
   ```

3. Use the WeeklyAvailabilityDialog component to:
   - Create non-overlapping availability slots (should succeed)
   - Create overlapping availability slots (should fail with detailed error message)
   - Create availability slots across time zone boundaries
   - Create availability slots during DST transitions

4. Verify that the error messages are clear and helpful to the user.

## Troubleshooting

If you encounter issues during testing:

1. Check the Supabase logs:
   ```bash
   npx supabase logs
   ```

2. Verify the function exists:
   ```sql
   SELECT EXISTS(
     SELECT 1 FROM pg_proc 
     WHERE proname = 'prevent_overlapping_availability'
   ) as function_exists;
   ```

3. Verify the trigger exists:
   ```sql
   SELECT COUNT(*) as trigger_count 
   FROM pg_trigger 
   WHERE tgname = 'check_availability_overlap';
   ```

4. Verify the index exists:
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE indexname = 'idx_calendar_events_availability_overlap';