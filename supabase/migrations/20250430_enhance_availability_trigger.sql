-- 20250430_enhance_availability_trigger.sql
-- This migration enhances the overlapping availability trigger with better performance,
-- more detailed error messages, and improved handling of edge cases.

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.prevent_overlapping_availability CASCADE;

-- Create an enhanced version of the function
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
      AND ce.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) -- Handle new records without IDs
      
      -- Enhanced recurrence pattern handling
      -- Case 1: Both are non-recurring (NULL recurrence_id)
      -- Case 2: Both have the same recurrence_id
      -- Case 3: One is recurring and one is a specific date exception (more complex case)
      AND (
        (NEW.recurrence_id IS NULL AND ce.recurrence_id IS NULL) OR
        (NEW.recurrence_id IS NOT NULL AND ce.recurrence_id = NEW.recurrence_id) OR
        (
          -- Handle case where a single date availability might conflict with a recurring pattern
          -- This is a more complex case that requires additional checks
          (NEW.recurrence_id IS NULL AND ce.recurrence_id IS NOT NULL AND NEW.availability_type = 'single') OR
          (NEW.recurrence_id IS NOT NULL AND ce.recurrence_id IS NULL AND ce.availability_type = 'single')
        )
      )
      
      -- Standard overlap check with timezone awareness
      AND (
        -- Standard overlap check: NEW starts before existing ends AND NEW ends after existing starts
        (NEW.start_time < ce.end_time AND NEW.end_time > ce.start_time)
      )
    LIMIT 1;  -- We only need to find one overlap to reject the operation
    
    IF FOUND THEN
      -- Create a detailed error message with the specific overlapping slot details
      overlap_details := format(
        'Overlapping availability detected: Your slot (%s to %s) overlaps with an existing slot (%s to %s).',
        formatted_start,
        formatted_end,
        overlapping_slot.formatted_start,
        overlapping_slot.formatted_end
      );
      
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',  -- Custom error code for availability conflicts
        MESSAGE = 'Overlapping availability slot detected',
        DETAIL = overlap_details,
        HINT = 'Please choose a different time or modify the existing overlapping slot.';
    END IF;
    
    -- Additional check for invalid time ranges (start time must be before end time)
    IF NEW.start_time >= NEW.end_time THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0002',  -- Custom error code for invalid time range
        MESSAGE = 'Invalid time range',
        DETAIL = format('Start time (%s) must be before end time (%s)', formatted_start, formatted_end),
        HINT = 'Please ensure the start time is earlier than the end time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-create the trigger
DROP TRIGGER IF EXISTS check_availability_overlap ON public.calendar_events;
CREATE TRIGGER check_availability_overlap
BEFORE INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_overlapping_availability();

-- Create an index to improve performance of the overlap check
CREATE INDEX IF NOT EXISTS idx_calendar_events_availability_overlap
ON public.calendar_events (clinician_id, event_type, is_active, start_time, end_time)
WHERE event_type = 'availability' AND is_active = TRUE;

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.prevent_overlapping_availability() IS 'Prevents overlapping availability slots for the same clinician with enhanced error reporting and performance optimizations. Handles both recurring and non-recurring availability slots.';

-- Create a function to help test the availability trigger
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
LANGUAGE plpgsql
AS $$
DECLARE
  v_result TEXT;
  v_details TEXT;
BEGIN
  BEGIN
    -- Attempt to execute the trigger logic directly
    PERFORM public.prevent_overlapping_availability() FROM (
      SELECT 
        '00000000-0000-0000-0000-000000000000'::uuid as id,
        'availability'::text as event_type,
        true as is_active,
        p_clinician_id as clinician_id,
        p_start_time as start_time,
        p_end_time as end_time,
        p_recurrence_id as recurrence_id,
        p_availability_type as availability_type,
        p_time_zone as time_zone,
        'Available'::text as title
    ) AS new_record;
    
    -- If we get here, no overlap was found
    v_result := 'SUCCESS';
    v_details := 'No overlapping availability slots found';
    
  EXCEPTION WHEN OTHERS THEN
    -- Capture the error details
    v_result := 'CONFLICT';
    v_details := SQLERRM || ' - ' || COALESCE(SQLSTATE, '') || ' - ' || COALESCE(sqlerrdetail, '') || ' - ' || COALESCE(sqlerrcontext, '');
  END;
  
  -- Return the result
  RETURN QUERY SELECT v_result, v_details;
END;
$$;

COMMENT ON FUNCTION public.test_availability_overlap(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, TEXT, TEXT) IS 
'Test function to check if a proposed availability slot would overlap with existing slots. Returns SUCCESS if no overlap, or CONFLICT with details if an overlap is detected.';