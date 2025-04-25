
-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.prevent_overlapping_availability CASCADE;

-- Create an updated version of the function
CREATE OR REPLACE FUNCTION public.prevent_overlapping_availability()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check for overlaps if this is an active availability event
  IF NEW.event_type = 'availability' AND NEW.is_active = TRUE THEN
    -- Check for overlapping events from the same clinician
    IF EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE
        clinician_id = NEW.clinician_id
        AND event_type = 'availability'
        AND is_active = TRUE
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid) -- Handle new records without IDs
        -- For non-recurring events, check against all other events
        -- For recurring events, only check against events with the same recurrence_id
        AND (
          (NEW.recurrence_id IS NULL AND recurrence_id IS NULL) OR
          (NEW.recurrence_id IS NOT NULL AND recurrence_id = NEW.recurrence_id) OR
          (NEW.recurrence_id IS NULL AND recurrence_id IS NOT NULL) OR
          (NEW.recurrence_id IS NOT NULL AND recurrence_id IS NULL)
        )
        AND (
          -- Standard overlap check
          (NEW.start_time < end_time AND NEW.end_time > start_time)
        )
    ) THEN
      RAISE EXCEPTION 'Overlapping availability slot detected. Please choose a different time.';
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

-- Add comment explaining the function's purpose
COMMENT ON FUNCTION public.prevent_overlapping_availability() IS 'Prevents overlapping availability slots for non-recurring events';
